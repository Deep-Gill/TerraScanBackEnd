export type AmplifyDependentResourcesAttributes = {
    "function": {
        "restRoot": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "webhook": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "controllerLambda": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "agentLambda": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "emailLambda": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "terrascanbackendlayer": {
            "Arn": "string"
        }
    },
    "api": {
        "v1": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        },
        "webhook": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        }
    }
}