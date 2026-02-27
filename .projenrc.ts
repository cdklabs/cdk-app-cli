import { CdklabsTypeScriptProject } from "cdklabs-projen-project-types";

const project = new CdklabsTypeScriptProject({
  name: "cdk-app-cli",
  projenrcTs: true,
  private: false,
  enablePRAutoMerge: true,
  description: "The operator CLI for CDK applications.",
  repository: "https://github.com/cdklabs/cdk-app-cli",
  authorName: "Amazon Web Services",
  authorUrl: "https://aws.amazon.com",
  authorOrganization: true,
  defaultReleaseBranch: "main",

  bin: {
    "cdk-app": "bin/cdk-app",
  },
  deps: [
    "yargs",
    "fs-extra",
    "chalk@^4",
    "open",
    "yaml",
    "cdklabs-projen-project-types",
  ],
  devDeps: [
    "@types/fs-extra",
    "ts-node@^10.9.1",
    "cdklabs-projen-project-types",
  ],
  prettier: true,
  minNodeVersion: "20.0.0",
  releaseToNpm: true,
});

project.synth();
