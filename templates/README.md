# Installation Guide


## Tools

- Install node: https://nodejs.org/en/download/
- Install yarn: `npm install --global yarn`
- Install AWS-CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- Install Amplify: https://docs.amplify.aws/cli/start/install/
- Install Docker (Optional, Testing Only): https://docs.docker.com/get-docker/

## Create an AWS Account

Go to [https://aws.amazon.com](https://aws.amazon.com/) and create an AWS Account.

 ==✅IMPORTANT== Copy the following information here.

- Email:
- Password:
- AWS account name:

At the very last step, choose `Basic Support - Free` plan.

You should receive an email saying your qualifications for the Free Tier Service ↓ 

```
Welcome to Amazon Web Services 2 3For the next 12 months, you'll have free access to core AWS compute, 4storage, database, and application services within the limits of the 5Free Tier.
```

## Configure Amplify

Make sure you are logged out of AWS Console on your browser.

```
amplify configure # prompt AWS Log In Page
```

- Sign in as Root User
- Select `us-east-2`
- Set user name to be: TerraScan
  - At this point, it should open a webpage promoting your to configure user details
- Select `Access key - Programmatic access`
- Click Next: Permissions
- Select the following Policy
  - `AdministratorAccess`
  - `AdministratorAccess-Amplify`
- Click Next: Tags
- Click Next: Review
- Click Create user
-  ==✅IMPORTANT== Copy the credentials below:
  - Region: `us-east-2`
  - User name:
  - Access key ID:
  - Secret access key:
- Click Close
- Go back to the terminal and enter those credentials

## Configure AWS-CLI Credentials

Edit the following file `~/.aws/credentials` 

Replace its entire content with:

```
[default]
aws_access_key_id=YOUR_ACCESS_KEY_ID
aws_secret_access_key=YOUR_SECREDT_ACCESS_KEY
```

You should have your access key id and secret access key from previous step.

## Access `TerraScanBackEnd` folder

- Clone the `TerraScanBackEnd` repo or download the folder from canvas

## Set up Non-Amplify Infrastructure

- `cd` into `TerraScanBackEnd/templates/`
- `aws cloudformation deploy --template-file ./TerraScanStack.yaml --stack-name TerraScanStack`
  - This step set up Non-Amplify Resources such as VPC, RDS, Public/Private Subnets, Internet Gateway, Security Groups, and EFS
- Go to [CloudFormation](https://us-east-2.console.aws.amazon.com/cloudformation/home?region=us-east-2)
- Locate the Stack named `TerraScanStack`
- Navigate to `Output` 
  - ![2cbf776d-e28b-409c-b550-054d2961d8cd](markdownAssets/2cbf776d-e28b-409c-b550-054d2961d8cd.png)
- ==✅IMPORTANT== Record the values of these keys:
  - WebServerSecurityGroup:
  - DBEC2SecurityGroup:
  - FileSystemSecurityGroup:
  - PublicSubnet1:
  - PublicSubnet2:
  - PrivateSubnet1:
  - PrivateSubnet2:
  - FileSystemAccessPoint:
  - RDSAddress:
  - RDSPort:
- Configure Subnets for RDS
  - Follow the GIF
    ![Add Subnets To RDS](markdownAssets/ConfigureRDSSubnet.gif)
    If the GIF does not render, go to https://github.com/CPSC-319/TerraScanBackEnd/blob/amplify-guide/templates/markdownAssets/ConfigureRDSSubnet.gif
    - Make sure to select all availability zones
    - Make sure to select all subnets

## Populate the Database

Connect to the RDS with your desired DB client using the credentials:

| PGUSER     | the username of your postgresql user (RDS). Default to `postgres` |
| ---------- | ------------------------------------------------------------ |
| PGPASSWORD | the password of your postgresql user (RDS). Default to `CQ!$Yn5RjYh?S6?&` |
| PGHOST     | the host of your RDS (hostname). <br />This should be the `RDSAddress` from earlier steps. |
| PGPORT     | the port of your RDS.<br />This should be the `RDSPort` from earlier steps. |
| PGDATABASE | your database to connect to. Default to `terrascan_testing`  |

- `cd` to `TerraScanBackEnd/database`
- Run `definition.sql` in the DB
- Run `rules.sql` in the DB

## Setup Amplify for TerraScanBackend

### Create a new environment

```sh
$ cd TerraScanBackEnd/
$ amplify init
? Do you want to use an existing environment? No
? Enter a name for the environment sandbox
Using default provider  awscloudformation
? Select the authentication method you want to use: AWS access keys
? accessKeyId:  ********************
? secretAccessKey:  ****************************************
? region:  us-east-2
? You have configured environment variables for functions. How do you want to proceed? Update environment variables now.
```

- The environment name can be anything. We default to `sandbox`

### Enter the environment variables

#### `restRoot`

| Variable   | Function                                                     |
| ---------- | ------------------------------------------------------------ |
| PGUSER     | the username of your postgresql user (RDS). Default to `postgres` |
| PGPASSWORD | the password of your postgresql user (RDS). Default to `CQ!$Yn5RjYh?S6?&` |
| PGHOST     | the host of your RDS (hostname). <br />This should be the `RDSAddress` from earlier steps. |
| PGPORT     | the port of your RDS.<br />This should be the `RDSPort` from earlier steps. |
| PGDATABASE | your database to connect to. Default to `terrascan_testing`  |
| JWT_SECRET | the secret to use for JWT. Should be long (64+ characters) and random.<br />Default to `CDn6Yc2hx6AM6daLSCdjuMttbbjXd3rzj6fPS9CQwxvqGWeg4tZfzeh3faZkhg3y` |

#### `webhook`

| Variable              | Function                                                     |
| --------------------- | ------------------------------------------------------------ |
| ghPersonalAccessToken | `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` (You can also create your own [personal access token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token), assuming your account has permission to the testing repo) |
| efsPath               | /mnt/repos                                                   |
| isRemote              | true                                                         |
| secret                | `02ec821dd79b16e24de9e300c7b6e8ec6e20e5ff` <br />(or your own choice as long as it matches the the secret in github webhook) |

#### `controllerLambda`

| Variable   | Function                                                     |
| ---------- | ------------------------------------------------------------ |
| PGUSER     | the username of your postgresql user (RDS). Default to `postgres` |
| PGPASSWORD | the password of your postgresql user (RDS). Default to `CQ!$Yn5RjYh?S6?&` |
| PGHOST     | the host of your RDS (hostname). <br />This should be the `RDSAddress` from earlier steps. |
| PGPORT     | the port of your RDS.<br />This should be the `RDSPort` from earlier steps. |
| PGDATABASE | your database to connect to. Default to `terrascan_testing`  |



`emailLamba	`

| Variable    | Function                                                     |
| ----------- | ------------------------------------------------------------ |
| appLink     | Link to the Amplify Frontend                                 |
| emailSender | Sender Email Address for Scanning Summary. Any email is fine. |

-  ==✅IMPORTANT== Come back to configure this when you have deploy Amplify Frontend
- You can run `amplofy update function` and select `emailLambda` to update these values

### Edit Cloud Formation JSON for Each Lambda Functions

- Edit the `*-cloudformation-template.json` files inside `agentLambda`, `controllerLambda`, `emailLambda`, `restRoot` and `webhook` under `amplify/backend/function/`
- In the json files, look for the path `{}.Resources.LambdaFunction.Properties`. We will  edit the `VPCConfig` and `FileSystemConfigs`

```json
{
  "VpcConfig": {
    "SecurityGroupIds": [
      "sg-0f606163584461395",
      "sg-02fd208d013b41961",
      "sg-0e6a33287f225120f"
    ],
    "SubnetIds": [
      "subnet-0ffe086e122804021",
      "subnet-0ad29aaa1fe809a55"
    ]
  },
  "FileSystemConfigs": [
    {
      "Arn": "arn:aws:elasticfilesystem:us-east-2:582677951950:access-point/fsap-0cb2ec1d18682bb23",
      "LocalMountPath": "/mnt/repos"
    }
  ]
}
```

- Replace `SecurityGroupIds` with values from previous steps:
  - WebServerSecurityGroup
  - DBEC2SecurityGroup
  - FileSystemSecurityGroup
- Change `SubnetIds` with values from previous steps:
  - PrivateSubnet1
  - PrivateSubnet2
- Change `FileSystemConfigs.Arn` with a value from previous steps:
  -  FileSystemAccessPoint

### Install Dependencies

```sh
cd TerraScanBackEnd/
yarn install
yarn webhook:install
yarn restRoot:install
yarn layer:install
```

### Deploy

```sh
amplify push
```



## Find the webhookLambda end point And Configure Github Webhook

Go to AWS Console and navigate to API Gateway. Follow the path `APIs > webhook > Stages > dev` to get to webhook API. Copy the end point and **append `/apiWebhook/ghEvent`**.

They format should be something like:

https://lyiefr5af1.execute-api.us-east-2.amazonaws.com/dev/apiWebhook/ghEvent

This should be the link you use to configure GitHub Webhook along with the `ghPersonalAccessToken` you have entered earlier. For question `Which events would you like to trigger this webhook?`, select Pull Request.

![6bc7fbe3-bd12-42cf-a40f-49d9ad522dac](markdownAssets/6bc7fbe3-bd12-42cf-a40f-49d9ad522dac.png)

## Find the endpoint for Frontend

You can follow the same steps to get the endpoint for `v1`.  You will need that when you setup front-end.

**Make sure to append `/v1` to the url**. It should look something like:

https://jhstgvwqkl.execute-api.us-east-2.amazonaws.com/dev/v1

![bf8454ea-d27a-4de6-9bfd-f51a2e542a84](markdownAssets/bf8454ea-d27a-4de6-9bfd-f51a2e542a84.png)



## Setup Amplify for TerraScanFrontend

1. Go to the [AWS Amplify Console](https://us-east-2.console.aws.amazon.com/amplify/home?region=us-east-2#/)
2. Click on New app > Host web app
3. Choose GitHub, then authorize AWS to your GitHub account
4. Back on the console, choose the `production` branch of the `CPSC-319/TerraScanFrontEnd` repo
5. For the build and test settings, paste the following YAML:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yarn install
    build:
      commands:
        - yarn run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

6. Click next, then save and deploy
7. On the sidebar for your new app, choose environment variables and create one called `BACKEND_URL` with the URL to your backend (up to the /v1, with no trailing slashes). For example: https://jhstgvwqkl.execute-api.us-east-2.amazonaws.com/dev/v1
7. Go back and update environment variables for `emailLambda`

## Configure AWS Simple Email Services

1. Create a domain 
2. In AWS SES, click ‘verify a new domain’ and type in the the domain name
   ![c6acee8a-93a0-4126-8961-963b138f6d74](markdownAssets/c6acee8a-93a0-4126-8961-963b138f6d74.png)
   ![8e79b05c-416b-421b-bf9c-6d119c5f9939](markdownAssets/8e79b05c-416b-421b-bf9c-6d119c5f9939.png)
3. Go to the domain setting, type in Amazon SES domain verification TXT records value in the domain setting.
4. Go back to the AWS account, wait a few minutes, refresh, the new should be verified
5. To test the verified domain:
   1. go to Email Addresses tab, click ‘Verified a New Domain’
      ![b96ec041-30d7-405f-8401-e001e609e009](markdownAssets/b96ec041-30d7-405f-8401-e001e609e009.png)
   2. Type in the email address
      ![24ca2192-2c9c-4fb1-aaa6-a81c280fab9d](markdownAssets/24ca2192-2c9c-4fb1-aaa6-a81c280fab9d.png)
   3. Go to email account and verify the email
      ![c1f1cea0-29ee-4034-b99d-41ab0f8120d1](markdownAssets/c1f1cea0-29ee-4034-b99d-41ab0f8120d1.png)
   4. The email address identity should be ready
   5. Go back to Domain tab, click ‘Send a Test Email’, fill in the fields and click ’Send Test Email’
      ![1931aa50-1e19-4908-a66f-b85eef3c2476](markdownAssets/1931aa50-1e19-4908-a66f-b85eef3c2476.png)
      ![05eda22b-69fa-4712-874e-7aa21e23b35f](markdownAssets/05eda22b-69fa-4712-874e-7aa21e23b35f.png)
   6. The email should be sent
