const { describe, it} = require('mocha')
const chai = require('chai')
const nock = require('nock')
const expect = chai.expect
const { GithubHelper } = require('../../amplify/backend/function/webhook/src/github')
const data = require('../testData/tree.json')
const errorResponse = require('../../amplify/backend/function/webhook/src/util.js').errorResponse


describe('webhook github', () => {
    const owner = 'CPSC-319'
    const repo = 'TerraScanTestData'
    const branch = 'main'

    describe('generateRepoTreeURL', () => {
        it('should generate the correct url with recursive param default to true', () => {
            const actual = GithubHelper.generateRepoTreeURL({ owner, repo, branch })
            const expected = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=${true}`
            expect(actual).to.equal(expected)
        })

        it('should generate the correct url with recursive param set to false', () => {
            const actual = GithubHelper.generateRepoTreeURL({ owner, repo, branch, recursive: false })
            const expected = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=${false}`
            expect(actual).to.equal(expected)
        })

        it('should throw error when one or more param is missing', () => {
            expect(() => { GithubHelper.generateRepoTreeURL() }).to.throw('Missing one or more parameters')
        })
    })

    describe('getRepoFilePath', () => {
        const baseURL = 'https://api.github.com'
        const getPath = `/repos/${owner}/${repo}/git/trees/${branch}?recursive=${true}`
        const url = GithubHelper.generateRepoTreeURL({ owner, repo, branch })

        it('should get a list of file paths', async () => {
            // When you setup an interceptor for a URL and that interceptor is used, it is removed from the interceptor list.
            nock(baseURL).get(getPath).reply(200, data)
            const actual = await GithubHelper.getRepoFilePaths(url)
            const expected = data.tree.map(item => item.path)
            // Use .eql in order to deeply compare values regardless of order
            // https://stackoverflow.com/a/17527174/16961611
            expect(actual).to.eql(expected)
        })

        it('should get a list of file paths filtered by extension name', async () => {
            nock(baseURL).get(getPath).reply(200, data)
            const fileType = 'c'
            const actual = await GithubHelper.getRepoFilePaths(url, { fileType })
            const expected = data.tree.map(item => item.path).filter(path => path.split('.').pop() === fileType)
            expect(actual).to.eql(expected)
        })

        it('should thrown an error if tree size is maxed out', async () => {
            const truncatedData = { ...data, truncated: true }
            nock(baseURL).get(getPath).reply(200, truncatedData)
            try {
                await GithubHelper.getRepoFilePaths(url)
            } catch (err) {
                expect(err.message).to.equal(errorResponse['EXCEED_GITHUB_TREE_LIMIT'].message)
            }
        })
    })
})
