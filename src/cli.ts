import yargs from "yargs";
import { cdkApp } from "./app";

export async function main() {
  const args: any = yargs
    .usage(
      "$0 [construct] [subcommand]",
      "Run an operator command on your CDK app's constructs.",
      (builder) =>
        builder
          .positional("construct", {
            type: "string",
            description:
              "Name of a construct, or a full path to the construct.",
          })
          .positional("subcommand", {
            type: "string",
            description:
              'Operation to perform on the construct. Run "help" command for a list of available operations.',
          })
    )
    .demandOption(["construct"])
    .epilogue(
      "Extra configuration options available via environment variables:\n\n- CDK_APP_DIR - Path to cdk.out.\n- AWS_REGION - AWS region to run commands in."
    )
    .help().argv;

  // capture everything after `NODE cdk-app RESOURCE SUBCOMMAND`
  const restArgs = process.argv.slice(4);

  return cdkApp({
    constructName: args.construct,
    subcommand: args.subcommand,
    appDir: process.env.CDK_APP_DIR ?? "cdk.out",
    region:
      process.env.AWS_REGION ??
      process.env.CDK_DEFAULT_REGION ??
      // TODO: infer region from cdk.out/manifest.json
      "us-east-1",
    restArgs,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
