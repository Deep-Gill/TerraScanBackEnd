const fs = require('fs')
const readLine = require('readline')
const hcltojson = require('hcl-to-json')

function writeToEFS(event, result) {
    //TODO:BELOW COMMENTED OUT FOR TESTING:
    //const EFSfilepath = event.filePath + '-result.json'
    const EFSfilepath = event.prInfo.repoPath + '/results/' + event.fileName + '-result.json'
    const currentdate = new Date().toLocaleString('en-US', {timeZone: 'America/Vancouver'})
    result.date = currentdate
    result.prURL = event.prInfo.url
    result.username = event.prInfo.user	
    result.filepath = event.filePath
    result.resFilePath = EFSfilepath
    console.log(JSON.stringify(result))
    fs.writeFileSync(EFSfilepath, JSON.stringify(result))
}

exports.handler = async (event) => {
    // TODO: remove after testing
    //let event2 = JSON.parse(JSON.stringify(event))
    console.log(event)
    const filepath = event.filePath
    const rulesDir = event.prInfo.repoPath + '/rules'
    const result = []
    const resultFixed = []
    const deletedResources = []
    let status
    let skip = false
    try {
        const resources = TerraformToJSON(filepath)
        const resultObj = fixJob(event)
        if (resultObj) {
            removeDeletedResourcesFromResults(resources, resultObj, deletedResources, event)
        }
        if (resources === undefined && deletedResources.length === 0) {
            throw new Error('There are no resources in file')
        } else if (resources === undefined) {
            skip = true
        }
        if (!skip) {
            ruleHandler(rulesDir, resources, result, event, resultObj, resultFixed)
        }
        for (const violation of result) {
            const lineNumber = await getLineNumber(violation.file_path, violation.resource_name, violation.resource_desc)
            violation.line_number = lineNumber
        }
        for (const violation of resultFixed) {
            const lineNumber = await getLineNumber(violation.file_path, violation.resource_name, violation.resource_desc)
            violation.line_number = lineNumber
        }
        const numOfDeletedResources = deletedResources.length
        for (let i = 0; i < numOfDeletedResources; i++) {
            resultFixed.push(deletedResources[i])
        }
        if (result.length === 0 && resultFixed.length === 0) {
            status = 'NOVIOLATION'
        } else {
            status = 'VIOLATION'
        }
        const res = {status: status, results: result, resultsFixed: resultFixed}
        writeToEFS(event, res)
        return true
    } catch(e) {
        status = 'ERROR'
        const res = {status: status, errorMessage: e.message, results: [], resultsFixed: resultFixed}
        writeToEFS(event, res)
        console.log(e.message)
        return false
    }
}

function removeDeletedResourcesFromResults(resources, result, deletedResources, event) {
    let results = result.results
    let numOfResults = results.length
    for (let i = 0; i < numOfResults; i++) {
        let type = results[i].resource_name
        let name = results[i].resource_desc
        let res = type + '.' + name
        let rule = { resource: res }
        let isResInFile = null
        if (resources !== undefined) {
            isResInFile = isResourceInFile(rule, resources)
        }
        if (!isResInFile) {
            let resource = JSON.parse(JSON.stringify(results[i]))
            resource.fixed = true 
            resource.commit_sha = event.prInfo.commit_sha
            deletedResources.push(resource)
        }
    }
}

function fixJob(event) {
    const resultfilepath = event.prInfo.repoPath + '/results/' + event.fileName + '-result.json'
    //TODO: REMOVE BELOW AFTER DONE TESTING
    //const resultfilepath = event.filePath + '-result.json'
    try {
        let result = fs.readFileSync(resultfilepath, {encoding: 'utf-8'})
        result = JSON.parse(result)
        if (result['status'] === 'VIOLATION') {
            return result
        } else {
            return undefined
        }
    } catch (e) {
        return undefined
    }
    
}

function ruleHandler(rulesDir, resources, result, event, resultObj, resultFixed) {
    let attribute
    const files = fs.readdirSync(rulesDir)
    const numOfFiles = files.length
    for (let i = 0; i < numOfFiles; i++) {
        const file = files[i]
        const path = rulesDir + '/' + file
        const data = fs.readFileSync(path, {encoding: 'utf-8'})
        const ruleObj = JSON.parse(data)
        ruleObj['rule']['has'] ? attribute = 'has' : attribute = 'has_not'
        violationHandler(ruleObj, attribute, resources, result, event, resultObj, resultFixed)
    }

}

function violationHandler(ruleObj, attribute, resources, result, event, resultObj, resultFixed) {
    const rule = ruleObj['rule']
    const resourceObj = isResourceInFile(rule, resources)
    if (!resourceObj) {
        return
    }
    const resourceEntry = Object.entries(resourceObj)
    const resource = rule['resource'].split('.')[0]
    const requirements = []
    const size = rule[attribute].length
    for (let i = 0; i < size; i++) {
        let value = []
        if ((rule[attribute][i]['value'])) {
            value.push(rule[attribute][i]['value'])
        } else if (rule[attribute][i]['range']) {
            value = rule[attribute][i]['range']
        }
        const key = rule[attribute][i]['key']
        const keys = key.split('.')
        const data = {keys: keys, values: value}
        requirements.push(data)
    }
    validator(resourceEntry, requirements, resource, event, result, attribute, ruleObj, resultObj, resultFixed)
}

function isResourceInFile(rule, list) {
    const resource = rule.resource.split('.')
    const resources = Object.entries(list)
    const size = resources.length
    let name = null
    const type = resource[0]
    if (resource.length === 2) {
        name = resource[1]
    }
    for (let i = 0; i < size; i++) {
        if (resources[i][0] === type) {
            if (!name) {
                return resources[i][1]
            }
            const res = isNameInResource(resources[i][1], name)
            if (res) {
                return res
            }
        }
    }
    return null
}

function isNameInResource(resources, name) {
    const resObjects = Object.entries(resources)
    const size = resObjects.length
    for (let i = 0; i < size; i++) {
        if (name === resObjects[i][0]) {
            const data = {}
            data[resObjects[i][0]] = resObjects[i][1]
            return data
        }
    }
    return null
}

function validator(resourceEntry, requirements, resource, event, result, attribute, ruleObj, resultObj, resultFixed) {
    const size = resourceEntry.length
    
    //iterate over resources; has the name and type
    for (let i = 0; i < size; i++) {
        const reqSize = requirements.length
        let keyCounter = 0
        // iterate over the keys
        for (let j = 0; j < reqSize; j++) {
            const keys = requirements[j].keys
            const value = requirements[j].values
            const keysSize = keys.length
            let res = resourceEntry[i][1]
            let isKeyInResource = true
            for (let k = 0; k < keysSize; k++) {
                res = res[keys[k]]
                if (!res) {
                    isKeyInResource = false
                    break
                }
                if (Array.isArray(res) && (k !== keysSize - 1)) {
                    throw new Error('There is an array in the resource')
                }
            }

            //  deals with the edge case associated with rule networking_1-port-security
            if (isKeyInResource && Array.isArray(res)) {
                if (res.length === 1) {
                    res = res[0]
                }
            }

            if (attribute === 'has') {
                if (!isKeyInResource || (value.length !== 0 && !value.includes(res))) {
                    violationAdder(resourceEntry[i][0], resource, event, ruleObj, result, false, undefined, resultFixed)
                    break
                } else if (resultObj === undefined) {
                    continue
                } else {
                    for (const element of resultObj['results']) {
                        if (element['rule_id'] === ruleObj['rule_id'] && element['resource_desc'] === resourceEntry[i][0]
                         && element['resource_name'] === resource) {
                            keyCounter++
                            if (keyCounter === reqSize) {
                                violationAdder(resourceEntry[i][0], resource, event, ruleObj, result, true, element['violation_id'], resultFixed)
                            }
                            break
                        }
                    }
                }
            } else if (attribute === 'has_not') {
                if (isKeyInResource && (value.length === 0 || value.includes(res))) {
                    violationAdder(resourceEntry[i][0], resource, event, ruleObj, result, false, undefined, resultFixed)
                    break
                } else if (resultObj === undefined) {
                    continue
                } else {
                    for (const element of resultObj['results']) {
                        if (element['rule_id'] === ruleObj['rule_id'] && element['resource_desc'] === resourceEntry[i][0]
                             && element['resource_name'] === resource) {
                            keyCounter++
                            if (keyCounter === reqSize) {
                                violationAdder(resourceEntry[i][0], resource, event, ruleObj, result, true, element['violation_id'], resultFixed)
                            }
                            break   
                        }
                    }
                }
            }     
        }
    }
}


function violationAdder(name, type, event, ruleObj, result, fixed, violID, resultFixed) {
    const rule_id = ruleObj['rule_id']
    const rule_desc = ruleObj['rule_desc']
    const violation = {
        repo_name: event.prInfo.repoName,
        pull_url: event.prInfo.url,
        file_path: event.filePath,
        line_number: undefined,
        resource_desc: name,
        resource_name: type,
        rule_id: rule_id,
        rule_desc: rule_desc,
        user_email: event.prInfo.userEmail,
        fixed: fixed,
        violation_id: violID,
        commit_sha: event.prInfo.commit_sha
    }
    if (fixed) {
        resultFixed.push(violation)
    } else {
        result.push(violation)
    }
    
}

function TerraformToJSON(filepath) {
    const terraformFile = fs.readFileSync(filepath, { encoding: 'utf-8' })
    const result = hcltojson(terraformFile)
    return result.resource
}

async function getLineNumber(filepath, type, name) {
    const fileStream = fs.createReadStream(filepath)
    const rl = readLine.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    })

    return await findResource(rl, type, name).then((lineNumber) => {
        return Promise.resolve(lineNumber)
    }).catch((err) => {
        return Promise.reject(new Error('The line was not found'))
    })
}

async function findResource(rl, type, name) {
    let lineNumber = 0
    for await (const line of rl) {
        lineNumber++
        if (line.includes('resource') && line.includes(type) && line.includes(name)) {
            if (line.indexOf('resource') < line.indexOf(type) < line.indexOf(name)) {
                return Promise.resolve(lineNumber)
            }
        }
    }
}