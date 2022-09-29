const axios = require('axios')
const errorResponse = require('../util').errorResponse
class GithubHelper {
    /**
     * Return a list of filepaths from a repository
     * @param {string} repoURL 
     * @param {object} options {fileType: string}
     * @return {string[]}
     * @throws throw error if the file list exceeds github api limit
     * 
     * example repoURL would be 'https://api.github.com/repos/grumbach/ft_ping/git/trees/master?recursive=1'
     * https://docs.github.com/en/rest/reference/git#get-a-tree
     */
    static async getRepoFilePaths(repoURL, options = {}) {
        if (!repoURL) throw new Error('Invalid repoURL')
        const { ghPersonalAccessToken, fileType } = options

        const headers = {
            'accept': 'application/vnd.github.v3+json'
        }
        if (ghPersonalAccessToken) {
            headers['Authorization'] = `Bearer ${ghPersonalAccessToken}`
        }
        const res = await axios.get(repoURL, { headers, responseType: 'json' })
        if (!res || !res.data || !res.data.tree) return []
        if (res.truncated == true) throw new Error(errorResponse('EXCEED_GITHUB_TREE_LIMIT').message)

        let filePaths = res.data.tree.map(item => item.path)

        if (fileType) {
            filePaths = filePaths.filter(path => path.split('.').pop() === fileType)
        }
        return filePaths
    }

    /**
     * Generate Github Endpoint for a tree object in the format of https://api.github.com/repos/[USER]/[REPO]/git/trees/[BRANCH]?recursive=1
     * @param {*} params {owner: string, repo: string, branch: string, recursive: string}
     * @returns string
     * 
     * example params would be { owner: 'grumbach', repo: 'ft_ping', branch: 'master', recursive: 'true' }
     * https://docs.github.com/en/rest/reference/git#get-a-tree
     */
    static generateRepoTreeURL(params = {}) {
        const { owner, repo, branch, recursive = true } = params
        if (!owner || !repo || !branch) throw new Error(errorResponse('MISSING_PARAMS').message)
        return `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=${recursive}`
    }

}


// https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
// https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#webhook-payload-object-34
const ACCEPTED_GITHUB_EVENTS = Object.freeze({ PULL_REQUEST: 'pull_request' })
const ACCEPTED_GITHUB_EVENT_ACTIONS = Object.freeze({
    OPENED: 'opened',
    REOPENED: 'reopened',
    // synchronize: Triggered when a pull request's head branch is updated.
    // For example, when the head branch is updated from the base branch,
    // when new commits are pushed to the head branch, or when the base branch
    // is changed.
    SYNCHRONIZE: 'synchronize'
})

module.exports = {
    GithubHelper,
    ACCEPTED_GITHUB_EVENTS,
    ACCEPTED_GITHUB_EVENT_ACTIONS
}