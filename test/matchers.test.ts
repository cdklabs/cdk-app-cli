import templateFixture from "./fixtures/DemoAppStack.template.json";
import treeFixture from "./fixtures/tree.json";
import {
  createCfnTemplateResourceNameMatcher,
  createTreeJsonResourceNameMatcher,
  createTreeJsonResourceTypeMatcher,
  matchesPath,
} from "../src/matchers";
import { tryFindByPredicate } from "../src/util";

test("matchesPath", () => {
  expect(matchesPath("MyQueue", "DemoAppStack")).toEqual(false);
  expect(matchesPath("MyQueue", "DemoAppStack/MyQueue")).toEqual(true);
  expect(matchesPath("MyQueue", "MyQueue/Resource")).toEqual(true);
  expect(matchesPath("MyQueue", "DemoAppStack/MyQueue/Resource")).toEqual(true);
});

test("createTreeJsonResourceNameMatcher", () => {
  const treeJsonMatcher = createTreeJsonResourceNameMatcher("MyQueue");
  expect(tryFindByPredicate(treeFixture, treeJsonMatcher)).toEqual({
    key: "MyQueue",
    value: expect.objectContaining({
      id: "MyQueue",
      path: "DemoAppStack/MyQueue",
    }),
  });
});

test("createTreeJsonResourceTypeMatcher", () => {
  const treeJsonMatcher =
    createTreeJsonResourceTypeMatcher("aws-cdk-lib.Stack");
  expect(tryFindByPredicate(treeFixture, treeJsonMatcher)).toEqual({
    key: "DemoAppStack",
    value: expect.objectContaining({
      id: "DemoAppStack",
      path: "DemoAppStack",
    }),
  });
});

test("createCfnTemplateResourceNameMatcher", () => {
  const cfnTemplateMatcher = createCfnTemplateResourceNameMatcher(
    "DemoAppStack/MyQueue/Resource"
  );
  expect(tryFindByPredicate(templateFixture, cfnTemplateMatcher)).toEqual({
    key: "MyQueueE6CA6235",
    value: expect.objectContaining({
      Type: "AWS::SQS::Queue",
      Metadata: {
        "aws:cdk:path": "DemoAppStack/MyQueue/Resource",
      },
    }),
  });
});
