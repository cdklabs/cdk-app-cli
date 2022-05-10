# cdk-app

The operator CLI for CDK apps. Experimental.

`cdk-app` lets you associate commands with CDK constructs so that you can quickly invoke functions, redrive queues, visit resources in the AWS console, and more by just referencing the construct name.

### Examples:

* `cdk-app MyLambda tail-logs` - stream logs in real time from the Lambda's log group
* `cdk-app TransactionTable visit-console` - open the AWS console page for your table
* `cdk-app OrderQueue redrive-queue` - retry messages that failed to get processed

## 🚀 Getting Started

Create a [CDK app](https://www.npmjs.com/package/aws-cdk) with a Lambda
function, and deploy it to your AWS account.

```ts
const fn = new lambda.Function(this, 'MyLambda', {
  code: lambda.Code.fromInline("exports.handler = async (event) => { console.log('event: ', event) };"),
  handler: 'index.handler',
  runtime: lambda.Runtime.NODEJS_14_X,
});
```

Next, `npm install -g cdk-app-cli` and view the available commands:

```
$ cdk-app MyLambda
Commands:
  describe
  invoke
  visit-console
  audit-console
```

Run a command to instantly access the construct in the AWS console:

```
$ cdk-app MyLambda visit-console
```

Or run a command to get information in your command line:

```
$ cdk-app MyLambda describe
> aws lambda get-function --function-name DemoAppStack-MyLambdaCCE802FB-lELPCJlktCim
{
    "Configuration": {
        "FunctionName": "DemoAppStack-MyLambdaCCE802FB-lELPCJlktCim",
        ...
```

Any extra arguments you pass will get automatically passed through to the
underlying command.

You can add your own commands by defining a JSON or YAML file in your CDK app
named `construct-commmands`. For example, here we define some commands that use
the [awslogs](https://github.com/jorgebastida/awslogs) CLI:

```yaml
# construct-commands.yml
aws-cdk-lib.aws_lambda.Function:
  logs:
    exec: awslogs get /aws/lambda/${PHYSICAL_RESOURCE_ID} --start='5m ago'
  tail-logs:
    exec: awslogs get /aws/lambda/${PHYSICAL_RESOURCE_ID} ALL --watch
```

Now these commands will be available to use:

```
$ cdk-app MyLambda
Commands:
  describe
  invoke
  visit-console
  audit-console
  logs
  tail-logs
```

Try using `cdk-app` in scripts as well!

```bash
#!/usr/bin/env bash

declare -a arr=("MyLambda" "MyTable" "MyQueue")

for construct in "${arr[@]}"; do
  cdk-app "$construct" visit-console
done
```

## 📖 Documentation

### Command line options

```
cdk-app [construct] [subcommand]

Run an operator command on your CDK app's constructs.

Positionals:
  construct                                                  [string] [required]
  subcommand                                                            [string]

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]

Extra configuration options available via environment variables:

- CDK_APP_DIR - Path to cdk.out.
- AWS_REGION - AWS region to run commands in.
```

### construct-commands.json

#### Command types

| Type | Description |
| ----------- | ----------- |
| open | Specify a URL or file to open. |
| exec | Specify a command to run in your shell. |

#### Command substitutions

| Syntax | Description |
| ----------- | ----------- |
| `${AWS_REGION}` | The AWS_REGION of the current shell environment (e.g. `us-east-1`). |
| `${PHYSICAL_RESOURCE_ID}` | The physical resource ID of construct's default resource. A construct named "Default" or "Resource" will automatically be assumed to be the default. |
| `${URL_ENCODED_PHYSICAL_RESOURCE_ID}` | The same as `${PHYSICAL_RESOURCE_ID}`, except the value is URL encoded. |

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
