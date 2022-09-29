/* eslint-disable no-unused-vars */
/* Amplify Params - DO NOT EDIT
	ENV
	FUNCTION_AGENTLAMBDA_NAME
	REGION
Amplify Params - DO NOT EDIT */

const fs = require('fs')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ region: process.env.Region })
const pool = require('db')

exports.handler = async (event) => {
    const prInfo = {
        user: event.prAuthor,
        url: event.prUrl,
        branch: event.branchName,
        repo: event.repoName,
        repoPath: event.localPath,
        userEmail: 'leannsc0@gmail.com',
    }

    if (!prInfo.repoPath) {
        throw new Error('No repository path found on EFS')
    }

    prInfo.userEmail = await pool.query('SELECT email FROM users WHERE github_username = $1', [prInfo.user])
        .then((result, err) => {
            if (result) return result.rows[0].email 
            else return ''
        }).catch(() => {
            console.error('err')
            return ''
        })

    // Generate list of filePaths
    const filePaths = event.filePaths.map(
        (file) => prInfo.repoPath + '/' + file
    )

    try {
        // Get latest rules and store into EFS
        await getRules(prInfo.repoPath)

        // Trigger agentLambdas to parse terraform file for each filePath
        for (const filePath of filePaths) {
            await triggerAgents(filePath, prInfo)
        }

    } catch (err) {
        console.error('Error in validation: ' + err)
    }

    console.log('STARTING JOB SUMMARY COLLECTION')
    const jobSummary = await pollEFS(filePaths, 3)
    const updatedJobSummary = await parseViolation(jobSummary, prInfo)
    if (prInfo.userEmail) {
        sendEmailSummary(updatedJobSummary, prInfo)
    }
    return true
}

const triggerAgents = async (filePath, prInfo) => {
    const params = {
        FunctionName: 'agentLambda-dev',
        InvocationType: 'Event',
        Payload: JSON.stringify({
            filePath: filePath,
            prInfo: prInfo,
        }),
    }

    await lambda
        .invoke(params, (err, data) => {
            if (err) {
                console.error(err, err.stack)
                throw new Error(err)
            } else
                console.log(
                    'Triggered Agent Lambda for file: ' +
                        filePath +
                        ' Res: ' +
                        data.StatusCode
                )
        })
        .promise()
}

// fetches rules from db and stores them in the efs
const getRules = async (repoPath) => {
    const rulesPath = repoPath + '/rules'
    fs.rmdirSync(rulesPath, { recursive: true })
    fs.mkdirSync(rulesPath)
    await pool
        .query('SELECT * FROM rules')
        .then((result) => {
            for (const row of result.rows) {
                // Create new rules file and store into /rules folder in the repoPath
                if (parseInt(row.id)) {
                    const yamlFile = {}
                    yamlFile['rule_id'] = row.id
                    yamlFile['rule'] = row.yaml_file
                    const yaml_file = JSON.stringify(yamlFile)

                    fs.writeFileSync(rulesPath + '/' + row.id, yaml_file)
                }
            }
        })
        .catch((err) => {
            console.error(err)
            throw new Error(err)
        })
}

const sendEmailSummary = async (jobSummary, prInfo) => {
    /* 
        Payload to send to emailLambda is jobSummary
        Contains a list of the json data from agentLambda validation
        sorted according to failed parsing or completed parsing (w/ violation and without)
    */
    const params = {
        FunctionName: 'emailLambda-dev',
        InvocationType: 'Event',
        Payload: JSON.stringify({
            prInfo: prInfo,
            jobSummaryInfo: jobSummary,
        }),
    }
    console.log('Sending job summary to email Lambda')
    await lambda
        .invoke(params, (err, res) => {
            console.log('emailLambda invoked')
            if (err) console.error(err, err.stack)
        })
        .promise()
}

const addViolation = async (violation, userName) => {

    await pool
        .query(
            'INSERT INTO violations(repo_name, pull_url, file_path, line_number, resource_name, rule_id, github_username)VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, timestamp_found',
            [
                violation.repo_name,
                violation.pull_url,
                violation.file_path,
                violation.line_number,
                violation.resource_name,
                violation.rule_id,
                userName,
            ]
        )
        .then((result, err) => {
            if (err) console.error('ERROR in res: ' + err)
            else {
                violation.violation_id = result.rows[0].id
                violation.timestamp_found = result.rows[0].timestamp_found
            }
        })
        .catch((err) => {
            throw new Error(err)
        })
    return true
}

const parseViolation = async (jobSummary, prInfo) => {
    const isValidViolation = (violation) => {
        let isViolation = true

        const violationKeys = [
            'repo_name', 
            'pull_url', 
            'file_path', 
            'line_number', 
            'resource_name', 
            'rule_id', 
            'user_email'
        ]
        // check that the violation has the need parameters
        violationKeys.forEach(key => {
            if (!(violation.hasOwnProperty(key))) {
                console.log('missing violation key: ' + key + ' for file: ' + violation.file_path)
                isViolation = false
            }
        })
        return isViolation
    }
    let violationJobs = jobSummary.violationJobs


    for (let i = 0; i < violationJobs.length; i++) {
        // get the violation from the results array from each violationResults
        for (let j = 0; j < violationJobs[i].length; j++) {
            try {
                const violation = violationJobs[i][j]
                if (isValidViolation(violation)) {
                    violationJobs[i][j] = await addViolation(violation, prInfo.user)
                } else {
                    jobSummary.noResultJobs.push({error: 'violation missing key parameters', file_path: violation.file_path})
                }
            } catch (err) {
                throw new Error('Error in parsing violation: ' + err)
            }
        }
    }
    jobSummary.violationJobs = violationJobs

    if (prInfo.userEmail) {
        await sendEmailSummary(jobSummary, prInfo)
    }
}

const pollEFS = async function (filePaths, maxAttempts) {
    /*  
     - Given list of triggered jobs, poll efs for file creation
     - check the result.json file from an agent is created,
     - read output file, timeout over 5 min, returns boolean
     - store into jobSummaryInfo 
  */
    const jobSummaryInfo = {
        failedJobs: [],
        violationJobs: [],
        noViolationJobs: [],
        noResultJobs: [],
    }
    const validate = {
        FAILED: (filePath) => jobSummaryInfo.failedJobs.push(filePath),
        VIOLATION: (readResFile) =>
            jobSummaryInfo.violationJobs.push(readResFile.results),
        NOVIOLATION: (readResFile) =>
            jobSummaryInfo.noViolationJobs.push(readResFile.results),
        ERROR: (filePath) => jobSummaryInfo.noResultJobs.push(filePath),
    }
    const resFilePaths = filePaths.map((filePath) => filePath + '-result.json')
    const waitForFiles = (waitTime) => new Promise(resolve => setTimeout(resolve, waitTime))
    let waitTime = 3000

    const pollBody = async (filesToCheck, attempts) => {
        const updatedFilesToCheck = []
        console.log('Attempts: ' + attempts)

        filesToCheck.forEach((resFilePath) => {
            // Get the filename of the result file as the ${filename}-result.json
            if (attempts > 0) {
                if (fs.existsSync(resFilePath)) {
                    const resFile = fs.readFileSync(resFilePath, 'utf8')
                    const readResFile = JSON.parse(resFile)
                    validate[readResFile.status]?.(readResFile) ??
                        console.log(readResFile.filePath + ' has no status')
                } else {
                    // If no such file exists, add to updated array of files to check
                    updatedFilesToCheck.push(resFilePath)
                }
            } else {
                // If no more attempts, if file still doesn't exist,
                // add the original file path to the list of error files
                validate['FAILED']?.(resFilePath.replace('-result.json', ''))
            }
        })

        if (updatedFilesToCheck.length >= 1) {
            waitTime+=waitTime
            await waitForFiles(waitTime)
            await pollBody(updatedFilesToCheck, attempts--)
        }
    }

    await waitForFiles(waitTime)
    await pollBody(resFilePaths, maxAttempts)
    return jobSummaryInfo
}
