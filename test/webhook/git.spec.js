const { describe, it } = require('mocha')
const chai = require('chai')
const spies = require('chai-spies')

chai.use(spies)

const expect = chai.expect

const fs = require('fs')
const { PullRequestHelper } = require('../../amplify/backend/function/webhook/src/git')
const { ACCEPTED_GITHUB_EVENT_ACTIONS } = require('../../amplify/backend/function/webhook/src/github')
const { shHelper } = require('../../amplify/backend/function/webhook/src/sh')


describe('webhook git', () => {
    const cloneURL = 'https://github.com/CPSC-319/TerraScanTestData.git'
    const repoName = 'TerraScanTestData'
    const branchName = 'main'
    const pathStr = 'somePath'

    describe('PullRequestHelper clone', () => {
        it('should thrown error for missing parameter', async () => {
            try {
                await PullRequestHelper.clone()
            } catch (error) {
                expect(error.message).to.equal('gitClone: Missing Parameters')
            }
        })

        it('should execute even when ghPersonalAccessToken is omitted', async () => {
            const spy1 = chai.spy.on(fs, 'existsSync', () => false)
            const spy2 = chai.spy.on(fs, 'mkdirSync')
            const spy3 = chai.spy.on(shHelper, 'exec', () => Promise.resolve())

            try {
                await PullRequestHelper.clone(
                    ACCEPTED_GITHUB_EVENT_ACTIONS.SYNCHRONIZE,
                    cloneURL,
                    repoName,
                    branchName,
                    pathStr
                    /* no ghPersonalAccessToken*/
                )
            } catch (error) {
                console.log(error)
            }

            expect(spy1).to.have.been.called()
            expect(spy2).to.have.been.called()
            expect(spy3).to.have.been.called()

            chai.spy.restore(shHelper, 'exec')
        })
    })
})
