const exec = require('child_process').exec

class shHelper {
    /**
     * Execute simple shell command (async wrapper). Logs will be printed.
     * @param {String} cmd
     * @param {Object} options {debug: boolean}
     * @return {Object} { stdout: String, stderr: String }
     *
     * Ref:
     * -  https://stackoverflow.com/a/31897900/16961611
     */
    static async exec(cmd, option = {}) {
        /**
         * Split the string by new lines and print each line
         * @param {String} consoleStr
         */
        const printShCommandConsole = (consoleStr) => {
            consoleStr.split('\n').forEach((line) => {
                line ? console.log(`sh: ${line}`) : null
            })
        }

        const { debug } = option
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (debug) {
                    console.log(`sh: ${cmd}`)
                }
                if (err) {
                    reject(err)
                } else {
                    if (debug) {
                        printShCommandConsole(stdout)
                        printShCommandConsole(stderr)
                    }
                    resolve({ stdout, stderr })
                }
            })
        })
    }
}

module.exports = {
    shHelper
}