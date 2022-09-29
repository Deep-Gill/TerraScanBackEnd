let aws = require("aws-sdk")
let ses = new aws.SES({ region: "us-east-2" })

exports.handler = async function (event) {
    // email setting
    const app_link = "https://production.d2u2qvge5tymuq.amplifyapp.com/"
    const email_sender = "notification@terrascan.top"
    const email_receivers = [event.prInfo.userEmail]
    const email_subject = "TerraScan Report"

    // test data
    const repo_name = event.prInfo.repoName
    const repo_link = event.prInfo.url
    const pr_author = event.prInfo.prAuthor
    const jobSummaryInfo = event.jobSummaryInfo
    const numViolations = jobSummaryInfo.violationJobs.length.toString()
    const numNoViolations = jobSummaryInfo.noViolationJobs.length.toString()
    const numFailed = jobSummaryInfo.failedJobs.length.toString()
    const numError = jobSummaryInfo.noResultJobs.length.toString()

    let failedJobs_list = ""
    function generator_failedJobs(failedJobs) {
        failedJobs_list += `
        <tr>
            <td>${failedJobs.error}</td>
            <td>${failedJobs.file_path}</td>
        </tr>
        `
    }
    if (jobSummaryInfo.failedJobs != null) {
        jobSummaryInfo.failedJobs.forEach(generator_failedJobs)
    }

    let violationJobs_list = ""
    function generator_violationJobs(violationJobs) {
        console.log('VIOLATION JOB ' + violationJobs)
        violationJobs.forEach(violationJob => {
            console.log('Violation Job: ' + violationJob)
            const res = violationJob
            if (res.violation_id != undefined) {
                console.log('RES : ' + JSON.stringify(res))
                const rule_id = res.rule_id.toString()
                violationJobs_list += 
                `
                <tr>
                    <td>${res.violation_id}</td>
                    <td>${res.file_path}</td>
                    <td>${rule_id}</td>
                </tr>
                `
            }
        })}
    if (
        jobSummaryInfo.violationJobs != null &&
    jobSummaryInfo.violationJobs != undefined
    ) {
        jobSummaryInfo.violationJobs.forEach(generator_violationJobs)
    } else {
    }

    let noviolationJobs_list = ""
    function generator_noviolationJobs(noViolationJobs) {
        noviolationJobs_list += `
        <tr>
            <td>${noViolationJobs}</td>
        </tr>
        `
    }
    if (jobSummaryInfo.noViolationJobs != null) {
        jobSummaryInfo.noViolationJobs.forEach(generator_noviolationJobs)
    } else {
    }

    let noResultJobs_list = ""
    function generator_noresultJobs(noResultJobs) {
        noResultJobs_list += `
        <tr>
            <td>${noResultJobs}</td>
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
                <span>Repository Name:${repo_name}</span><br/>
                <span>Pull request link:${repo_link}</span>
                <span>Rull Request author:${pr_author}</span>
            </div>
            <div>
                <h2>Report</h2>
                <h3> Quick Summary </h3>
                <span>Number of Violations found:${numViolations}</span>
                <span>Number of Files with no violations:${numNoViolations}</span>
                <span>Number of Files with errors:${numFailed}</span>
                <span>Number of Files not parsed:${numError}</span>
                <div>
                    <div>
                        <h3>failed jobs</h3>
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
                        <h3>violation jobs</h3>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>Violation ID</th>
                                    <th>File        </th>
                                    <th>Rule id     </th>
                                </tr>
                                ${violationJobs_list}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3>no violation jobs</h3>
                        <table style="width:70%">
                            <tbody>
                                <tr>
                                    <th>File name  </th>
                                </tr>
                                ${noviolationJobs_list}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3>no result jobs</h3>
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
                <span>
                    For more information, head to the <a href=${app_link}>TerraScan App</a>
                </span>
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
