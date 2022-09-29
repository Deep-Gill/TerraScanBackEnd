exports.push = async (event, context) => {
    console.log('Terraform Root Files')
}

const fs = require('fs')
const readLine = require('readline')
const hcltojson = require('hcl-to-json')

function TerraformToJSON(filepath) {
    // Verify filename is a terraform file?? Is it the responsibility of this function?
    const terraformFile = fs.readFileSync(filepath, { encoding: 'utf-8' })
    const result = hcltojson(terraformFile)
    return result.resource
}
   
// - Arguments
//     - type and name are strings associated with the resource, they form the resource id
// - It is assumed that type and name are on the same line
// - returns
//      - resolved Promise with line number if required resource exists in the file
//      - rejected Promise with error if line does not exist in file
async function getLineNumber(filepath, type, name) {
    let lineNumber = 0
    const fileStream = fs.createReadStream(filepath)
    const rl = readLine.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })

    for await (const line of rl) {
        lineNumber++
        if (
            line.includes('resource') &&
            line.includes(type) &&
            line.includes(name)
        ) {
            if (
                line.indexOf('resource') <
                line.indexOf(type) <
                line.indexOf(name)
            ) {
                return Promise.resolve(lineNumber)
            }
        }
    }

    return Promise.reject(new Error('The line was not found'))
}

module.exports = {
    TerraformToJSON,
    getLineNumber
}