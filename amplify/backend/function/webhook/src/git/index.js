const fs = require('fs')
const path = require('path')

const { shHelper } = require('../sh')
const { ACCEPTED_GITHUB_EVENT_ACTIONS } = require('../github')
const { errorResponse } = require('../util')

class PullRequestHelper {
    /**
     * Clone and check out a repository at a specific branch
     * @param {string} action type of actions specified by ACCEPTED_GITHUB_EVENT_ACTIONS
     * @param {string} cloneURL
     * @param {string} repoName
     * @param {string} branchName
     * @param {string} pathStr local folder path in file system
     * @param {string} ghPersonalAccessToken optional token. May be required for private repo cloning
     *
     * Ref:
     * - https://www.freecodecamp.org/news/git-clone-branch-how-to-clone-a-specific-branch/
     */
    static async clone(
        action,
        cloneURL,
        repoName,
        branchName,
        pathStr,
        ghPersonalAccessToken,
    ) {
        if (!action || !cloneURL || !repoName || !branchName || !pathStr) {
            throw new Error('gitClone: Missing Parameters')
        }
        const tokenStr = ghPersonalAccessToken ? ghPersonalAccessToken + '@' : ''
        const cloneURLWithToken = 'https://' + tokenStr + cloneURL.slice(8)
        const branchOption = `--branch ${branchName}`

        const directoryExists = fs.existsSync(pathStr)
        if (directoryExists && action == ACCEPTED_GITHUB_EVENT_ACTIONS.SYNCHRONIZE) {
            fs.rmdirSync(pathStr, { recursive: true })
            console.log(`gitClone: Overridden path ${pathStr}`)
        } else if (directoryExists) {
            throw new Error(errorResponse('PULL_REQUEST_FOLDER_ALREADY_EXISTS').message)
        }

        // EFS does not create a folder automatically. Must create it first.
        fs.mkdirSync(pathStr, { recursive: true }) // https://stackoverflow.com/a/26815894

        // clone repo at a specific branch to a path determined by pathStr
        await shHelper.exec(`git clone ${branchOption} ${cloneURLWithToken} ${pathStr}`)
    }

    /**
     * Save the PR Summary as a JSON at the specific file path
     * @param {*} filePath 
     * @param {*} prSummary 
     */
    static saveSummary(filePath, prSummary) {
        // https://stackoverflow.com/a/31350277/16961611
        fs.writeFileSync(filePath, JSON.stringify(prSummary, null, 2), 'utf-8')
    }

    /**
     * Generate Path String based on local file system or EFS
     * @param {string} repoOwner
     * @param {string} repoName
     * @param {string} prNum pull request number
     * @param {boolean} options { efsPath: string }
     * @return {string}
     * @throws when environment variable efsPath not set up
     */
    static generatePath(repoOwner, repoName, prNum, options) {
        const { efsPath } = options
        const suffix = `${repoOwner}_${repoName}_${prNum}`
        if (efsPath)
            return `${efsPath}/${suffix}`

        // Local Folder Path
        return path.resolve(
            __dirname,
            `../efs/${suffix}`
        )
    }
}

module.exports = { PullRequestHelper }
