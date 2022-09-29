// testing libraries
// mocha
const { describe, it } = require('mocha')

// chai
const chai = require('chai')
const expect = chai.expect

const controllerPolling = require('./src/index').pollEFS

describe('pollingEFS', () => {
    const filepath1 = __dirname + '/results/error.tf'
    const filepath2 = __dirname + '/results/no-violation.tf'
    const filepath3 = __dirname + '/results/violation.tf'
    const filepath4 = __dirname + '/noresults'

    const resultFilePaths = [filepath1, filepath2, filepath3, filepath4]
    const maxAttempts = 3

    it('should poll for the result.json files from a given filePaths', async () => {
        return controllerPolling(resultFilePaths, maxAttempts).then((jobSummary) => {
            console.log(jobSummary)
            expect(Object.keys(jobSummary)).to.include('failedJobs')
            expect(Object.keys(jobSummary)).to.include('violationJobs')
            expect(Object.keys(jobSummary)).to.include('noViolationJobs')
            expect(Object.keys(jobSummary)).to.include('noResultJobs')
            expect(Object.keys(jobSummary)).to.include('fixedJobs')
            expect(Object.keys(jobSummary).length).to.equal(5)
            expect(jobSummary.fixedJobs.length).to.equal(0)

            // ERROR FILE
            expect(jobSummary.failedJobs[0].status).to.equal('ERROR')
            expect(jobSummary.failedJobs[0].errorMessage).to.equal(
                'No Resources found in terraform file'
            )
            expect(jobSummary.failedJobs.length).to.equal(1)

            // VIOLATION FILE
            expect(jobSummary.violationJobs[0].status).to.equal('VIOLATION')
            expect(jobSummary.violationJobs[0].results.length).to.equal(1)
            expect(jobSummary.violationJobs[0].results[0].rule_id).to.equal(29)
            expect(jobSummary.violationJobs.length).to.equal(1)
            expect(jobSummary.violationJobs[0].results.length).to.equal(1)

            // NOVIOLATION FILE
            expect(jobSummary.noViolationJobs[0].status).to.equal('NOVIOLATION')
            expect(jobSummary.noViolationJobs.length).to.equal(1)

            // FAILED JOBS no result.json
            expect(jobSummary.noResultJobs[0]).to.equal(filepath4)
            expect(jobSummary.noResultJobs.length).to.equal(1)

        })
    })
})
