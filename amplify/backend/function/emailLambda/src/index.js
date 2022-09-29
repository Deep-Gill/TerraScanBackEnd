let aws = require('aws-sdk')
let ses = new aws.SES({ region: 'us-east-2' })

exports.handler = async function (event) {
    // email setting
    const app_link = 'https://production.d2u2qvge5tymuq.amplifyapp.com/'
    const email_sender = 'notification@terrascan.top'
    const email_receivers = [event.prInfo.userEmail]
    const email_subject = 'TerraScan Report'

    // test data
    const repo_name = event.prInfo.repoName
    const repo_link = event.prInfo.url
    const pr_author = event.prInfo.user
    const commit_sha = event.prInfo.commit_sha
    const jobSummaryInfo = event.jobSummaryInfo
    const numFixedJobs = jobSummaryInfo.fixedJobs.length.toString()
    const numNoViolations = jobSummaryInfo.noViolationJobs.length.toString()
    const numFailed = jobSummaryInfo.failedJobs.length.toString()
    const numError = jobSummaryInfo.noResultJobs.length.toString()
    const parseFileName = (filePath) => {
        return filePath.replace(event.prInfo.localPath + '/', '')
    }

    let failedJobs_list = ''
    function generator_failedJobs(failedJobs) {
        let fileName = parseFileName(failedJobs.filepath)
        failedJobs_list += `
        <tr>
            <td>${fileName}</td>
            <td>${failedJobs.errorMessage}</td>
        </tr>
        `
    }
    if (jobSummaryInfo.failedJobs != null) {
        jobSummaryInfo.failedJobs.forEach(generator_failedJobs)
    }

    let violationJobs_list = ''
    let numViolations = 0
    function generator_violationJobs(violationJobs) {
        console.log('VIOLATION JOB ' + violationJobs)
        const violationRes = violationJobs.results
        violationRes.forEach((violationJob) => {
            console.log('Violation Job: ' + violationJob)
            const res = violationJob
            if (res.violation_id != undefined) {
                console.log('RES : ' + JSON.stringify(res))
                const rule_id = res.rule_id.toString()
                let rule_desc = res.rule_desc ? res.rule_desc : ''
                let addionalComments =
                    'Resource in violation: ' +
                    res.resource_name +
                    ' at line: ' +
                    res.line_number +
                    '\n '
                let fileName = parseFileName(res.file_path)
                numViolations++
                violationJobs_list += `
                <tr>
                    <td>${res.violation_id}</td>
                    <td>${fileName}</td>
                    <td>${rule_id}</td>
                    <td>${rule_desc}</td>
                    <td>${addionalComments}</td>
                </tr>
                `
            }
        })
    }
    if (
        jobSummaryInfo.violationJobs != null &&
        jobSummaryInfo.violationJobs != undefined
    ) {
        jobSummaryInfo.violationJobs.forEach(generator_violationJobs)
    } else {
    }

    let fixedJobs_list = ''
    function generator_fixedJobs(fixedJobs) {
        console.log('FIXED VIOLATION JOB ' + fixedJobs)
        const res = fixedJobs
        if (res.violation_id != undefined && res.fixed) {
            console.log('RES : ' + JSON.stringify(res))
            let fileName = parseFileName(res.file_path)
            fixedJobs_list += `
                <tr>
                    <td>${res.violation_id}</td>
                    <td>${fileName}</td>
                    <td>${res.line_number}</td>
                    <td>${res.commit_sha}</td>
                </tr>
                `
        }
    }
    if (
        jobSummaryInfo.fixedJobs != null &&
        jobSummaryInfo.fixedJobs != undefined
    ) {
        jobSummaryInfo.fixedJobs.forEach(generator_fixedJobs)
    } else {
    }

    let noviolationJobs_list = ''
    function generator_noviolationJobs(noViolationJobs) {
        let fileName = parseFileName(noViolationJobs.filepath)
        noviolationJobs_list += `
        <tr>
            <td>${fileName}</td>
        </tr>
        `
    }
    if (jobSummaryInfo.noViolationJobs != null) {
        jobSummaryInfo.noViolationJobs.forEach(generator_noviolationJobs)
    } else {
    }

    let noResultJobs_list = ''
    function generator_noresultJobs(noResultJobs) {
        let fileName = parseFileName(noResultJobs)
        noResultJobs_list += `
        <tr>
            <td>${fileName}</td>
        </tr>

        `
    }
    if (jobSummaryInfo.noResultJobs != null) {
        jobSummaryInfo.noResultJobs.forEach(generator_noresultJobs)
    } else {
    }

    const messageDetail = `<html>
        <head>
            <style>
                table, th, td {
                    border: 1px solid black;
                    border-collapse: collapse;
                    text-align: center;
                }
                h1{color: #d80404;}
                #image{  
                    max-width:20%;
                    max-height:20%;
                    align:center;
                }
            </style>
            <title>Violation found</title>
        </head>
        <body>
            <div>
            <h1>TerraScan<h1>
            </div>
            <div>
                <span>Repository Name:  ${repo_name}</span><br/>
                <span>Pull request link: ${repo_link}</span><br/>
                <span>Rull Request author: ${pr_author}</span><br/>
                <span>Git Commit SHA: ${commit_sha}</span></br>
            </div>
            <div>
                <h2>Report</h2>
                <h3> Quick Summary </h3>
                <span>Number of Violations found:  ${numViolations}</span><br/>
                <span>Number of Violations fixed:  ${numFixedJobs}</span><br/>
                <span>Number of Files with no violations:  ${numNoViolations}</span><br/>
                <span>Number of Files with errors:  ${numFailed}</span><br/>
                <span>Number of Files not parsed:  ${numError}</span><br/></br>
                <div>
                    <div>
                        <h2>Violation</h2>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>Violation ID</th>
                                    <th>File        </th>
                                    <th>Rule ID   </th>
                                    <th>Rule description</th>
                                    <th>Additional Comments</th>
                                </tr>
                                ${violationJobs_list}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h2>Fixed Violations</h2>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>Violation ID</th>
                                    <th>File        </th>
                                    <th>Line Number </th>
                                    <th>Git Commit  </th>
                                </tr>
                                ${fixedJobs_list}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h2>No Violation Files</h2>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>Files  </th>
                                </tr>
                                ${noviolationJobs_list}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h2>Error Files</h2>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>File</th>
                                    <th>Error Cause </th>
                                </tr>
                                ${failedJobs_list}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3>Files Not Parsed</h3>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>File path</th>
                                </tr>
                                ${noResultJobs_list}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div>
                </br></br><span>
                    For more information, head to the <a href=${app_link}>TerraScan App</a>
                </span>
                </br>
            </div>
        </body>
    </html>`

    const params = {
        Destination: {
            ToAddresses: email_receivers,
        },
        Message: {
            Subject: { Data: email_subject },

            Body: {
                Html: {
                    Data: messageDetail,
                },
            },
        },
        Source: email_sender,
    }

    return ses.sendEmail(params).promise()
}
