const { typescript } = require("projen");
const project = new typescript.TypeScriptProject({
  name: "cdk-app-cli",
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
  devDeps: ["@types/fs-extra"],

  prettier: true,

  minNodeVersion: "14.17.0",

  autoApproveOptions: {
    allowedUsernames: ["cdklabs-automation"],
    secret: "GITHUB_TOKEN",
  },
  autoApproveUpgrades: true,
});

project.synth();
