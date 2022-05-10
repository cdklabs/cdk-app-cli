export interface CloudAssembly {
  treeJson: TreeJson;
  cfnTemplate: any;
}

export interface Resource {
  treeData: TreeJsonResource;
  cfnTemplateData: any; // TODO: make more specific
  runtimeData: DescribeStackResourcesItem;
}

export interface TreeJson {
  readonly version: string;
  readonly tree: TreeJsonResource;
}

// TODO; make more specific / improve
export interface TreeJsonResource {
  readonly id: string;
  readonly path: string;
  readonly children?: TreeJsonResource[];
  readonly attributes?: any;
  readonly constructInfo?: TreeJsonConstructInfo;
}

export interface TreeJsonConstructInfo {
  readonly fqn: string;
  readonly version: string;
}

export interface DescribeStackResourcesOutput {
  readonly StackResources: DescribeStackResourcesItem[];
}

export interface DescribeStackResourcesItem {
  readonly StackName: string;
  readonly StackId: string;
  readonly LogicalResourceId: string;
  readonly PhysicalResourceId: string;
  readonly ResourceType: string;
  readonly Timestamp: string;
  readonly ResourceStatus: string; // can make more specific
  readonly DriftInformation: any; // can make more specific
}
