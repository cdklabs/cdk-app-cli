import { typescript } from "projen";

const project = new typescript.TypeScriptProject({
  name: "cdk-app-cli",
  projenrcTs: true,
  description: "The operator CLI for CDK applications.",
  repository: "https://github.com/cdklabs/cdk-app-cli",
  authorName: "Amazon Web Services",
  authorUrl: "https://aws.amazon.com",
  authorOrganization: true,
  defaultReleaseBranch: "main",

  bin: {
    "cdk-app": "bin/cdk-app",
  },
  deps: ["yargs", "fs-extra", "chalk@^4", "open", "yaml"],
  devDeps: ["@types/fs-extra", "ts-node@^10.9.1"],

  prettier: true,

  minNodeVersion: "14.17.0",

  autoApproveOptions: {
    allowedUsernames: ["cdklabs-automation"],
    secret: "GITHUB_TOKEN",
  },
  autoApproveUpgrades: true,

  releaseToNpm: true,
});

project.synth();
