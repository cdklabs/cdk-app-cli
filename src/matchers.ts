import { TreeJsonResource } from "./model";
import { Condition } from "./util";

export function matchesPath(nameOrPath: string, resourcePath: string): boolean {
  return resourcePath.includes(nameOrPath);
}

export function createCfnTemplateResourceNameMatcher(
  resourcePath: string
): Condition<any> {
  return (_key: string, value: any): value is any =>
    value.hasOwnProperty("Metadata") &&
    value.Metadata.hasOwnProperty("aws:cdk:path") &&
    value.Metadata["aws:cdk:path"] === resourcePath;
}

export function createTreeJsonResourceNameMatcher(
  resourcePath: string
): Condition<TreeJsonResource> {
  return (_key: string, value: any): value is TreeJsonResource =>
    value.hasOwnProperty("path") && value.path.includes(resourcePath);
}

export function createTreeJsonResourceTypeMatcher(
  resourceType: string
): Condition<TreeJsonResource> {
  return (_key: string, value: any): value is TreeJsonResource =>
    value.hasOwnProperty("constructInfo") &&
    value.constructInfo.hasOwnProperty("fqn") &&
    value.constructInfo.fqn === resourceType;
}
