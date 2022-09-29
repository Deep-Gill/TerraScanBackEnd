const fs = require('fs')
const yaml = require('js-yaml')
const { v4: uuidv4 } = require('uuid')


function getFiles() {
    /*
    let path = '/Users/deepgill/WebstormProjects/TerraScanBackEnd/test/terraform/yaml_rules/Storage/ensure-docdb-has-audit-logs-enabled.yaml'
    let data = fs.readFileSync(path, {encoding: 'utf-8'})
    let json = yaml.load(data)
    let pathWrite = __dirname + '/Storage/ensure-docdb-has-audit-logs-enabled.yaml.json'
    fs.writeFileSync(pathWrite, JSON.stringify(json))
    */
    let dir = '/Storage'
    let path = '../yaml_rules' + dir
    const names = fs.readdirSync(path)

    for(let element of names) {
        let np = path + '/' + element
        let pathToStore = __dirname + dir + '/' + element + '.json'
        let yam = fs.readFileSync(np, {encoding: 'utf-8'})
        let js = yaml.load(yam)
        const id = uuidv4()
        const result = {
            rule_id: id,
            rule: js
        }
        fs.writeFileSync(pathToStore, JSON.stringify(result))

    }
}

getFiles()