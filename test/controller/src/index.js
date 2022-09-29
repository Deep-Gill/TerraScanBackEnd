// TESTING ONLY FUNCTIONALITY WITH NO AWS DEPENDENCIES or USE AWS RESOURCES such as LAMBDA INVOKE, RDS

const fs = require('fs')

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
    const waitForFiles = (waitTime) =>
        new Promise((resolve) => setTimeout(resolve, waitTime))
    let waitTime = 1

    const pollBody = async (filesToCheck, attempts) => {
        const updatedFilesToCheck = []

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
            waitTime += waitTime
            await waitForFiles(waitTime)
            attempts--
            await pollBody(updatedFilesToCheck, attempts)
        }
    }

    await waitForFiles(waitTime)
    await pollBody(resFilePaths, maxAttempts)
    return jobSummaryInfo
}

const addFixedViolation = async (fixedViolation) => {
    console.log(fixedViolation)
    return true
}

const addNewViolation = async (violation, prInfo) => {
    const id = Date.now()
    violation.violation_id = id
    violation.timestamp_found = new Date().getTime()
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
                        jobSummary.noResultJobs.push(violation.file_path)
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

    }
    jobSummary.violationJobs = violationJobs

    return jobSummary
}

module.exports = {
    pollEFS,
    parseViolation
}