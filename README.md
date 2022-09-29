# TerraScanBackEnd

## Environment Set Up

1. `cd` to project root directory
2. run `npm install`
3. run `npm run install:lambda`

### Set Up Visual Studio Code

Install [Visual Studio Code](https://code.visualstudio.com/)

#### Set up Prettier

Install [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Append the following configuration to your .vscode/settings.json

```JSON
{
  ...
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.formatOnSave": true,
  "prettier.requireConfig": true
}
```

#### Setup Eslint

Install [ESLint](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

#### Set up EditorConfig

Install [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

#### Setup AWS Toolkit for Lambda

1. Follow the [AWS Installation Guide](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/setup-toolkit.html) for AWS Toolkit. Make sure to also install NPM, Node, Docker, AWS SAM CLI if you don't already have them.
2. Search for `Connect to AWS` command
3. Create a new local profile with any name
4. Input the access key and secret access key from [confluence page](https://seven-of-spades.atlassian.net/wiki/spaces/SS/pages/4554753/AWS+Account)

## Lambda Function Tutorial

1. go to `lambda/template.yaml`
2. add another lambda function under `Resources`

```yml
ClockFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: clock/
      Handler: app.clock
      Runtime: nodejs14.x
      Events:
        clockApi:
          Type: Api
          Properties:
            Path: /clock
            Method: get
```

3. Create a folder in `lambda/` named `Clock`
4. Create an app.js file. It should contain function named `clock()`

Examples can be found in: <https://github.com/CPSC-319/TerraScanBackEnd/commit/ea3f31c3f9878194c38bae57673db7e6ff29121a>

### References

- ==✅IMPORTANT== [Working with serverless applications](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-deploy)
  - [Assumptions and prerequisites](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-assumptions)
  - [IAM permissions for serverless applications](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-permissions)
  - [Creating a new serverless application (local)](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-create)
  - [Opening a serverless application (local)](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-open)
  - [Running and debugging a serverless application from template (local)](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-debug)
  - [Deploying a serverless application to the AWS Cloud](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-deploy)
  - [Deleting a serverless application from the AWS Cloud](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps.html#serverless-apps-delete)
  - [Running and debugging Lambda functions directly from code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps-run-debug-no-template.html)
  - [Running and debugging local Amazon API Gateway resources](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/debug-apigateway.html)
  - [Configuration options for debugging serverless applications](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps-run-debug-config-ref.html)
  - [Troubleshooting serverless applications](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/serverless-apps-troubleshooting.html)
  - [Interact with Remote Lambda Functions](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/remote-lambda.html)

## Daily Script

### Scripts in `TerraScan/`

==💩TODO== Add more

### Scripts in `TerraScan/lambda/`

- `npm run test` will run all unit tests

---

## Outdated

### Create a new lambda function

1. Search for `Create Lambda SAM Application`
2. Choose `nodejs14.x`
3. Choose `AWS SAM Hello World`
4. Give the lambda function a name
5. Save it to project root directory
6. The new lambda function will be saved in a folder with the same name. You can start writing the code and commit it to git.

### Invoke a lambda function in vscode locally

1. Open the file containing the lambda function
2. Press `f5` in VSCode
3. Sometime the process will get stuck at a breakpoint in /var/runtime/index.js. Just click continue.

### Deploy a lambda function

1. Open the folder containing the lambda function
2. Follow AWS Tutorial to manually deploy the lambda function\
    1. Choose the correct template file based on the lambda folder path
    2. Region → use `us-east-2`
    3. If this is a brand new function, create a new bucket with a globally unique name
    4. If you are override a lambda function, enter the original bucket name
3. Wait until lambda function is completed
4. Navigate to <https://195217959898.signin.aws.amazon.com/console> and sign in using AWS Credentials from [confluence page](https://seven-of-spades.atlassian.net/wiki/spaces/SS/pages/4554753/AWS+Account)
5. Search for Lambda services
6. You can find the new lambda function deployed

### Testing Lambda Function Locally

1. `cd` to the lambda function folder
2. `npm run test`

### Automatic testing setup

1. Install Docker for your machine
2. Run the postgres container from the Dockerfile in test/postgres/Dockerfile, exposing port 5433:5432
```cd
docker build -t pgunittest test\postgres
docker run -p 5433:5432 -t pgunittest
```
3. Run `yarn test`
