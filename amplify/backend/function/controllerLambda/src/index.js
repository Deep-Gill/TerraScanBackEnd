/* eslint-disable no-unused-vars */
/* Amplify Params - DO NOT EDIT
	ENV
	FUNCTION_AGENTLAMBDA_NAME
	REGION
Amplify Params - DO NOT EDIT */

const fs = require('fs')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ region: 'us-east-2' })
const pool = require('db')

exports.handler = async (event) => {
    console.log(event)
    const prInfo = {
        user: event.prAuthor,
        url: event.prUrl,
        branch: event.branchName,
        repoName: event.repoName,
        localPath: event.localPath,
        commit_sha: event.prHeadSha,
        gitAction: event.action,
        userEmail: '',
        repoPath: '',
    }
    const filePaths = event.filePaths

    if (!prInfo.localPath) {
        throw new Error('No repository path found on EFS')
    }

    prInfo.userEmail = await pool
        .query('SELECT email FROM users WHERE github_username = $1', [
            prInfo.user,
        ])
        .then((result, err) => {
            if (result) return result.rows[0].email
            else return ''
        })
        .catch(() => {
            console.error('err')
            return ''
        })

    // Generate list of filePaths
    const localFilePaths = filePaths.map(
        (file) => prInfo.localPath + '/' + file
    )
    const resultFilePaths = []

    // Get the repoPath
    prInfo.repoPath = prInfo.localPath.replace('/files', '')

    try {
        // Get latest rules and store into EFS
        await getRules(prInfo.repoPath)

        // Trigger agentLambdas to parse terraform file for each filePath
        for (const filePath of localFilePaths) {
            // Create the results directory and filePaths if new PR
            const resultPath = filePath.replace('/files/', '/results/')
            resultFilePaths.push(resultPath)
            if (!fs.existsSync(resultPath)) {
                fs.mkdirSync(resultPath, { recursive: true })
            }
            await triggerAgents(filePath, prInfo)
        }
    } catch (err) {
        console.error('Error in validation: ' + err)
    }

    console.log('STARTING JOB SUMMARY COLLECTION')
    const jobSummary = await pollEFS(resultFilePaths, 3)
    await parseViolation(jobSummary, prInfo)

    return true
}

const parseFileName = (filePath, localPath) => {
    return filePath.replace(localPath + '/', '')
}

const triggerAgents = async (filePath, prInfo) => {
    const fileName = parseFileName(filePath, prInfo.localPath)

    const params = {
        FunctionName: `agentLambda-${process.env.ENV}`,
        InvocationType: 'Event',
        Payload: JSON.stringify({
            fileName: fileName,
            filePath: filePath,
            prInfo: prInfo,
        }),
    }

    console.log('INVOKE AGENT LAMBDA')
    await lambda
        .invoke(params, (err, data) => {
            if (err) {
                console.error(err, err.stack)
                throw new Error(err)
            } else
                console.log(
                    'Triggered Agent Lambda for fileName: ' +
                        fileName +
                        ' filepath: ' +
                        filePath +
                        ' Res: ' +
                        data.StatusCode
                )
        })
        .promise()
}

// fetches rules from db and stores them in the efs
const getRules = async (repoPath) => {
    console.log('FETCHING RULES')
    const rulesPath = repoPath + '/rules'
    fs.rmdirSync(rulesPath, { recursive: true })
    fs.mkdirSync(rulesPath)
    await pool
        .query('SELECT * FROM rules WHERE enabled = true')
        .then((result) => {
            for (const row of result.rows) {
                if (parseInt(row.id)) {
                    const yamlFile = {}
                    yamlFile['rule_id'] = row.id
                    yamlFile['rule_desc'] = row['description']
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
        FunctionName: `emailLambda-${process.env.ENV}`,
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

const addFixedViolation = async (fixedViolation) => {
    const id = parseInt(fixedViolation.violation_id)
    console.log(id)
    await pool
        .query(
            'UPDATE violations Set timestamp_fixed = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        )
        .then((result, err) => {
            if (err) {
                console.error(
                    'Error in updating fixed violation to Database: ' + err
                )
                return false
            } else {
                console.log(result)
                //fixedViolation.timestamp_fixed = result.rows[0].timestamp_fixed
                console.log('ADDED FIXED VIOLATION: ' + fixedViolation)
            }
        })
        .catch((err) => {
            console.log(err)
            throw new Error('ERROR in updating violation: ' + err)
        })

    return true
}

const addNewViolation = async (violation, prInfo) => {
    let violationFilePath = parseFileName(violation.file_path, prInfo.localPath)

    await pool
        .query(
            'INSERT INTO violations(repo_name, pull_url, file_path, line_number, resource_name, rule_id, github_username)VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, timestamp_found',
            [
                violation.repo_name,
                violation.pull_url,
                violationFilePath,
                violation.line_number,
                violation.resource_name,
                violation.rule_id,
                prInfo.user,
            ]
        )
        .then((result, err) => {
            if (err)
                console.error(
                    'ERROR in adding new violation to Database: ' + err
                )
            else {
                violation.violation_id = result.rows[0].id
                violation.timestamp_found = result.rows[0].timestamp_found
            }
        })
        .catch((err) => {
            throw new Error(err)
        })
    return violation
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
        ]
        // check that the violation has the need parameters
        violationKeys.forEach((key) => {
            if (!violation.hasOwnProperty(key)) {
                console.log(
                    'missing violation key: ' +
                        key +
                        ' for file: ' +
                        violation.file_path
                )
                isViolation = false
            }
        })
        return isViolation
    }

    let violationJobs = jobSummary.violationJobs

    // Get the violations from results json
    for (let i = 0; i < violationJobs.length; i++) {
        // PARSE THE NEW VIOLATION RESULTS
        console.log('GETTING VIOLATIONS')
        const violationResult = violationJobs[i].results
        if (violationResult.length > 0) {
            // get the violation from the results array from each violationResults
            for (let j = 0; j < violationResult.length; j++) {
                try {
                    const violation = violationResult[j]
                    if (isValidViolation(violation)) {
                        const violationAdded = await addNewViolation(
                            violation,
                            prInfo
                        )
                        // Update violation in result.json file
                        violationResult[j] = violationAdded
                    } else {
                        jobSummary.noResultJobs.push(violation.results.filepath)
                    }
                } catch (err) {
                    throw new Error('Error adding violation: ' + err)
                }
            }
        } else {
            // If no violationResults, all violations are fixed, add file to noViolations
            jobSummary.noViolationJobs.push(violationJobs[i])
        }
        violationJobs[i].results = violationResult

        // PARSE THE FIXED THE VIOLATION RESULTS
        if (prInfo.gitAction == 'synchronize') {
            console.log('SYNCHRONIZE -> CHECKING FOR FIXED JOBS')
            const fixedResult = violationJobs[i].resultsFixed
            console.log('FIXED RESULT: ' + fixedResult)
            const fixedResultTemp = [...fixedResult]
            // get the violation from the results array from each violationResults
            for (let k = 0; k < fixedResultTemp.length; k++) {
                try {
                    const fixedViolation = fixedResultTemp[k]
                    console.log(fixedViolation)
                    if (fixedViolation.commit_sha == prInfo.commit_sha) {
                        const fixedResultAdded = await addFixedViolation(
                            fixedViolation,
                            prInfo
                        )
                        if (fixedResultAdded) {
                            fixedResult.splice(k, 1)
                            jobSummary.fixedJobs.push(fixedViolation)
                        }
                    }
                } catch (err) {
                    throw new Error('Error fixed violation: ' + err)
                }
            }
            // Update result.json by removing fixed violations
            if (fixedResult.length > 0) {
                fixedResult.forEach((res) => {
                    violationJobs[i].results.push(res)
                })
            }
        }
        violationJobs[i].resultsFixed = []

        //update the violations in -result.json file
        const resFilePath = violationJobs[i].resFilePath
        const violationUpdated = JSON.stringify(violationJobs[i])
        console.log(violationUpdated)
        fs.writeFileSync(resFilePath, violationUpdated)
    }
    jobSummary.violationJobs = violationJobs

    if (prInfo.userEmail) {
        await sendEmailSummary(jobSummary, prInfo)
    }
}

const pollEFS = async function (resultFilePaths, maxAttempts) {
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
        fixedJobs: [],
    }
    const validate = {
        ERROR: (readResFile) => jobSummaryInfo.failedJobs.push(readResFile),
        VIOLATION: (readResFile) =>
            jobSummaryInfo.violationJobs.push(readResFile),
        NOVIOLATION: (readResFile) =>
            jobSummaryInfo.noViolationJobs.push(readResFile),
        FAILED: (filePath) => jobSummaryInfo.noResultJobs.push(filePath),
    }
    const resFilePaths = resultFilePaths.map(
        (filePath) => filePath + '-result.json'
    )
    console.log('RESULT FILE PATH: ' + resFilePaths)
    const waitForFiles = (waitTime) =>
        new Promise((resolve) => setTimeout(resolve, waitTime))
    let waitTime = 10000

    const pollBody = async (filesToCheck, attempts) => {
        const updatedFilesToCheck = []
        console.log('Attempts: ' + attempts)

        filesToCheck.forEach((resFilePath) => {
            // Get the filename of the result file as the ${filename}-result.json
            if (attempts > 0) {
                if (fs.existsSync(resFilePath)) {
                    const resFile = fs.readFileSync(resFilePath, 'utf8')
                    const readResFile = JSON.parse(resFile)
                    console.log('RES File: ' + resFile)
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
            waitTime += waitTime
            await waitForFiles(waitTime)
            attempts--
            console.log(attempts)
            await pollBody(updatedFilesToCheck, attempts)
        }
    }

    await waitForFiles(waitTime)
    await pollBody(resFilePaths, maxAttempts)
    return jobSummaryInfo
}
