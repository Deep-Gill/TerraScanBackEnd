const { describe, it } = require('mocha')
const chai = require('chai')
const expect = chai.expect
const { shHelper } = require('../../amplify/backend/function/webhook/src/sh')

describe('webhook sh', () => {
    it('should execute echo command', async () => {
        const testString = 'This is a test'
        const { stdout, stderr } = await shHelper.exec(`echo ${testString}`)
        expect(stdout).to.equal(testString + '\n')
        expect(stderr).to.equal('')
    })

    it('should thrown error for unknown command', async () => {
        try {
            await shHelper.exec('notGit status')
        } catch (error) {
            expect(error.message.includes('command not found')).to.be.true
        }
    })
})
