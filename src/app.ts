import * as cp from "child_process";
import * as path from "path";
import chalk from "chalk";
import * as fs from "fs-extra";
import open from "open";
import { CommandStore } from "./command-store";
import {
  createCfnTemplateResourceNameMatcher,
  createTreeJsonResourceNameMatcher,
  createTreeJsonResourceTypeMatcher,
} from "./matchers";
import { CloudAssembly, DescribeStackResourcesOutput, Resource } from "./model";
import { fail, execCapture, tryFindByPredicate, log } from "./util";

const commandStore = new CommandStore();

export interface CdkAppOptions {
  // Name of the construct as specified by the user in the CDK App
  readonly constructName: string;
  // Subcommand specified for the construct
  readonly subcommand?: string;
  // Path to the CDK app's Cloud Assembly
  readonly appDir: string;
  // Any arguments passed after "cdk-app <construct> <subcommand>"
  readonly restArgs: string[];
  // AWS region to use
  readonly region: string;
}

export async function cdkApp(options: CdkAppOptions): Promise<void> {
  log(options);

  const {
    constructName: nameOrPath,
    subcommand,
    appDir,
    region,
    restArgs,
  } = options;

  const { treeJson, cfnTemplate: templateJson } = getCloudAssembly(appDir);

  const stackName = getStackName(treeJson);

  // TODO: cache this for up to a day
  const stackResourceMetadata = getStackResourceMetadata(stackName, region);

  log(stackResourceMetadata);

  const resource = findResource(
    nameOrPath,
    { treeJson, cfnTemplate: templateJson },
    stackResourceMetadata
  );

  if (!resource) {
    throw new Error(
      `Could not find a resource named "${nameOrPath}" in the CDK app.`
    );
  }

  if (!subcommand || subcommand === "help") {
    displayAvailableCommands(resource);
    return;
  }

  log(resource);

  await runCommand(resource, subcommand, region, restArgs);

  return;
}

function getCloudAssembly(appDir: string): CloudAssembly {
  if (!fs.existsSync(appDir)) {
    fail(
      new Error(`No cloud assembly found (expected to find it in "${appDir}").`)
    );
  }
  const treeJson: any = fs.readJsonSync(path.join(appDir, "tree.json"));

  // TODO: improve logic for figuring out the correct template by checking
  // the manifest.json file
  const files: string[] = fs
    .readdirSync(appDir)
    .filter((f) => f.endsWith(".template.json"));
  if (files.length === 0) {
    fail(
      new Error(
        `Could not find any template.json files in the cloud assembly directory ("${appDir}").`
      )
    );
  }
  const templateFileName = files[0];
  const cfnTemplate: any = fs.readJsonSync(path.join(appDir, templateFileName));

  return { treeJson, cfnTemplate };
}

function getStackResourceMetadata(
  stackName: string,
  region: string
): DescribeStackResourcesOutput {
  console.error("Refreshing stack metadata...");
  let output = execCapture(
    `AWS_REGION=${region} aws cloudformation describe-stack-resources --stack-name ${stackName}`,
    {
      cwd: process.cwd(),
    }
  );
  return JSON.parse(output.toString());
}

function findResource(
  nameOrPath: string,
  cloudAssembly: CloudAssembly,
  stackResourceMetadata: DescribeStackResourcesOutput
): Resource | undefined {
  const { treeJson, cfnTemplate } = cloudAssembly;

  // TODO: throw error if multiple resources matching the nameOrPath are found
  const treeJsonMatcher = createTreeJsonResourceNameMatcher(nameOrPath);
  const treeData = tryFindByPredicate(treeJson, treeJsonMatcher);
  if (!treeData) {
    fail(
      new Error(
        `Could not find resource with name "${nameOrPath}" in tree.json.`
      )
    );
  }

  // TODO: handle case where resource ends with "/Default"?
  const cfnTemplateMatcher = createCfnTemplateResourceNameMatcher(
    treeData.value.path + "/Resource"
  );
  const cfnTemplateData = tryFindByPredicate(cfnTemplate, cfnTemplateMatcher);
  if (!cfnTemplateData) {
    fail(
      new Error(
        `Could not find resource with aws:cdk:path metadata "${treeData.value.path}/Resource" in the CloudFormation template.`
      )
    );
  }

  const runtimeData = stackResourceMetadata.StackResources.find(
    (stackResource) => stackResource.LogicalResourceId === cfnTemplateData.key
  );
  if (!runtimeData) {
    fail(
      new Error(
        `Could not find logical id "${cfnTemplateData.key}" in describe-stack-resources metadata.`
      )
    );
  }

  return { treeData: treeData.value, cfnTemplateData, runtimeData };
}

export function displayAvailableCommands(resource: Resource) {
  const resourceType = resource.treeData.constructInfo?.fqn!;
  const commands = commandStore.commandsForResourceType(resourceType);

  if (!commands || Object.keys(commands).length === 0) {
    fail(new Error("No commands were found for this resource type."));
  }

  console.log("Commands:");
  for (const command of Object.keys(commands)) {
    console.log(`  ${command}`);
  }
}

export async function runCommand(
  resource: Resource,
  subcommand: string,
  region: string,
  restArgs: string[]
) {
  const resourceType = resource.treeData.constructInfo?.fqn!;

  const command = commandStore.findCommand(resourceType, subcommand);

  if (command?.open) {
    const url = processSubstitutions(command.open, resource, region);
    console.error(chalk.gray(`> Opening "${url}"...`));
    await open(url);
  } else if (command?.exec) {
    const baseCommand = processSubstitutions(command?.exec, resource, region);

    const args = restArgs.length > 0 ? " " + restArgs.join(" ") : "";

    const fullCommand = `${baseCommand}${args}`;
    console.error(chalk.gray(`> ${fullCommand}`));

    try {
      // pipe stdout and stderr in case of long running commands, like streaming logs
      const proc = cp.exec(fullCommand, {
        cwd: process.cwd(),
        env: {
          ...process.env,
          AWS_REGION: region,
        },
      });
      proc.stdout?.pipe(process.stdout);
      proc.stderr?.pipe(process.stderr);
    } catch (e: any) {
      fail(e as Error);
    }
  }
}

function getStackName(treeJson: any) {
  // TODO: what if there are multiple stacks?
  const stackMatcher = createTreeJsonResourceTypeMatcher("aws-cdk-lib.Stack");
  const stackData = tryFindByPredicate(treeJson, stackMatcher);
  if (!stackData) {
    fail(new Error("Could not find a stack within in the CDK app."));
  }
  return stackData.value.id;
}

function processSubstitutions(
  command: string,
  resource: Resource,
  region: string
) {
  command = command.replace(
    /\${URL_ENCODED_PHYSICAL_RESOURCE_ID}/g,
    encodeURIComponent(resource.runtimeData.PhysicalResourceId)
  );
  command = command.replace(
    /\${PHYSICAL_RESOURCE_ID}/g,
    resource.runtimeData.PhysicalResourceId
  );
  command = command.replace(/\${AWS_REGION}/g, region);
  return command;
}
