const AWS = require('aws-sdk')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const axios = require('axios')
const bodyParser = require('body-parser')
const express = require('express')
const verifier = require('verify-github-webhook-secret')

const { errorResponse, HTTPCode } = require('./util')
const { GithubHelper, ACCEPTED_GITHUB_EVENTS, ACCEPTED_GITHUB_EVENT_ACTIONS } = require('./github')
const { PullRequestHelper } = require('./git')

const efsPath = process.env.efsPath
const ghPersonalAccessToken = process.env.ghPersonalAccessToken
const isRemote = process.env.isRemote === 'true'
const webhookSecret = process.env.secret

const lambda = new AWS.Lambda({ region: 'us-east-2' })

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    next()
})

/**
 * GitHub event handler.
 * Both new pull requests and new pushes will be handled here and
 * can be distinguished by their header.
 *
 * Local Host: http://localhost:3000/apiWebhook/ghEvent
 * Remote: <AMPLIFY_ENDPOINT>/dev/apiWebhook/ghEvent
 *
 * TODO Suppress Missing x-apigateway-event or x-apigateway-context header(s) on local'
 */
app.post('/apiWebhook/ghEvent', async (req, res) => {
    /*
    Node Runtime for Amplify Function is 14.x
    However when we run `amplify mock function webhook`, I realized
    the node runtime becomes 12.x

    In that case, we cannot use optional chaining since that feature is
    only available for node13.x and above
    */
    if (
        !req ||
        !req.headers ||
        !req.body ||
        !req.body.repository ||
        !req.body.pull_request
    ) {
        res.status(HTTPCode.BAD_REQUEST)
        res.json(errorResponse('MISSING_PARAMS'))
        return
    }

    try {
        // https://github.com/screendriver/verify-github-webhook-secret
        const verified = await verifier.verifySecret(
            JSON.stringify(req.body),
            webhookSecret,
            req.headers['x-hub-signature']
        )

        if (!verified) {
            res.status(HTTPCode.UNAUTHORIZED)
            res.json(errorResponse('NOT_AUTHORIZED'))
            return
        }

        console.log('ghEvent: Webhook Signature Verified')
    } catch (error) {
        console.error(`ghEvent Error: ${error}`)
        res.status(HTTPCode.INTERNAL_SERVER_ERROR)
        res.json(error)
        return
    }

    const { repository, pull_request, action } = req.body
    const cloneUrl = repository.clone_url
    const repoName = repository.name
    const repoFullName = repository.full_name // e.g. CPSC-319/yaml-rules-and-terraform-violations
    const ownerName = repository.owner.login
    const defaultBranch = pull_request.head.repo.default_branch
    const branchName = pull_request.head.ref || defaultBranch
    const prHeadSha = pull_request.head.sha
    const prUrl = pull_request.html_url
    const prAuthor = pull_request.user.login
    const prNum = pull_request.number


    const ghEvent = req.headers['x-github-event']
    if (!Object.values(ACCEPTED_GITHUB_EVENTS).includes(ghEvent)) {
        res.status(HTTPCode.BAD_REQUEST)
        res.json(errorResponse('UNSUPPORTED_EVENTS'))
        return
    }

    // Send 200 for unsupported events such as closing Pull Request. This avoids confusions on the sender
    if (!Object.values(ACCEPTED_GITHUB_EVENT_ACTIONS).includes(action)) {
        res.status(HTTPCode.OK)
        res.json(errorResponse('UNSUPPORTED_ACTIONS'))
        return
    }
    
    console.log('ghEvent: Detected a New PR')

    try {
        const localPath = PullRequestHelper.generatePath(ownerName, repoName, prNum, { efsPath: isRemote ? efsPath : '' }) + '/files'

        console.log('ghEvent: Pulling the the entire branch')
        await PullRequestHelper.clone(
            action,
            cloneUrl,
            repoName,
            branchName,
            localPath,
            ghPersonalAccessToken,
        )
        console.log(
            `ghEvent: Succeeded in pulling the the entire branch: ${branchName}`
        )

        const repoTreeURL = GithubHelper.generateRepoTreeURL({
            owner: ownerName,
            repo: repoName,
            branch: branchName,
        })
        const filePaths = await GithubHelper.getRepoFilePaths(repoTreeURL, {
            fileType: 'tf',
            ghPersonalAccessToken,
        })
        console.log(
            `ghEvent: Fetched terraform filepaths from github at repo: ${repoName} and branch: ${branchName}`
        )
        filePaths.forEach((p) => console.log(`path: ${p}`))

        const prSummary = {
            action,
            repoName: repoFullName,
            branchName,
            prUrl,
            prAuthor,
            prHeadSha,
            filePaths,
            localPath,
            date: Date().toString()
        }

        const prSummaryJsonPath = PullRequestHelper.generatePath(ownerName, repoName, prNum, { efsPath: isRemote ? efsPath : '' }) + '/prSummary.json'
        PullRequestHelper.saveSummary(prSummaryJsonPath, prSummary)

        // https://stackoverflow.com/q/35754766/16961611
        const params = {
            FunctionName: `controllerLambda-${process.env.ENV}`,
            InvocationType: 'Event',
            Payload: JSON.stringify(prSummary),
        }
        const controllerResponse = await lambda.invoke(params).promise()
        if (controllerResponse.StatusCode != HTTPCode.ACCEPTED)
            throw new Error('There was an issues invoking Controller Lambda')
        console.log('ghEvent: Invoked Controller Lambda to scan the branch')
        console.log(`ghEvent: params: ${JSON.stringify(params)}`)

        res.json(prSummary)

    } catch (error) {
        console.error(`ghEvent Error: ${error}`)
        res.status(HTTPCode.INTERNAL_SERVER_ERROR)
        res.json({ message: error.message })
    }
})

// Sanity Test. Check for Internet Access
app.get('/apiWebhook/catfact', async (req, res) => {
    try {
        const catFactRes = await axios.get('https://catfact.ninja/fact', {
            responseType: 'json',
        })
        res.json(catFactRes.data)
    } catch (error) {
        console.log(error)
        res.status(HTTPCode.INTERNAL_SERVER_ERROR)
        res.json({ error: error.message })
    }
})

app.listen(3000, () => {
    console.log('App started')
    // console.log(process.env)
})

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
