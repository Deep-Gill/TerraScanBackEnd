// testing libraries
// mocha
const { describe, it, beforeEach, after} = require('mocha')
// chai
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)
const agentLambda = require('../../amplify/backend/function/agentLambda/src/index').handler
const fs = require('fs')

const tempDir = __dirname + '/rules'

let event = {
    prInfo : {
        gitUser: '',
        userEmail: '',
        url: '',
        branch: '',
        repoName: 'TerraScanTestData',
        repoPath: __dirname
    },
    filePath: '',
    fileName: ''
}

function deleteFile(file) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file)
    }
}

function addFilesInTempDir(rules) {
    const size = rules.length
    for (let i = 0; i < size; i++) {
        const rule = rules[i]
        const data = fs.readFileSync(rule, {encoding: 'utf-8'})
        const paths = rule.split('/')
        const fileName = paths[paths.length - 1]
        const tempPath = tempDir + '/' + fileName
        fs.writeFileSync(tempPath, data)
    }
}

function deleteDir(dir) {
    const files = fs.readdirSync(dir)
    const numOfFiles = files.length
    for (let i = 0; i < numOfFiles; i++) {
        const path = dir + '/' + files[i]
        deleteFile(path)
    }
    fs.rmdirSync(dir)
}

function getFileName(filepath) {
    const paths = filepath.split('/')
    return paths[paths.length - 1]
}

describe('validating the rules', () => {

    beforeEach(() => {
        if (fs.existsSync(tempDir)) {
            deleteDir(tempDir)
        }
        fs.mkdirSync(tempDir)
    })

    after(() => {
        if (fs.existsSync(tempDir)) {
            deleteDir(tempDir)
        }
    })

    describe('NETWORKING', () => {
        describe('Rule: ensure-transfer-server-is-not-exposed-publicly', () => {
            it('should pass as transfer server is exposed publicly', () => {
                const filepath = __dirname + '/tfFiles/Networking/ensure-transfer-server-is-exposed-publicly.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Networking/ensure-transfer-server-is-not-exposed-publicly.yaml.json'
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        const resultString = fs.readFileSync(EFSfilepath, { encoding: 'utf-8'})
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as transfer server is not exposed publicly as endpoint_type does not exist', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/ensure-transfer-server-is-not-exposed-publicly.test.none.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/ensure-transfer-server-is-not-exposed-publicly.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(10)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_transfer_server'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            it('testing fix', () => {
                const filepath =
                  __dirname + '/tfFiles/Networking/testingFix.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/ensure-transfer-server-is-not-exposed-publicly.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                const fixedFilepath = __dirname + '/tfFiles/Networking/testingFix-fixed.tf'
                const tempFilepath = filepath + '-temp.tf'
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_transfer_server'
                        )
                        expect(result[0].resource_desc).to.deep.equal('test')
                        expect(result[0].fixed).to.deep.equal(false)
                        const data = fs.readFileSync(filepath, {encoding: 'utf-8'})
                        fs.writeFileSync(tempFilepath, data)
                        const data2 = fs.readFileSync(fixedFilepath, {encoding: 'utf-8'})
                        fs.writeFileSync(filepath, data2)
                        event.filePath = filepath
                    }).then(() => {
                        return agentLambda(event).then((ret) => {
                            const resultString = fs.readFileSync(EFSfilepath, {
                                encoding: 'utf-8',
                            })
                            const json = JSON.parse(resultString)
                            const result = json.results
                            const resultsFixed = json.resultsFixed
                            const status = json.status
                            expect(ret).to.deep.equal(true)
                            expect(status).to.deep.equal('VIOLATION')
                            expect(result.length).to.deep.equal(0)
                            expect(resultsFixed.length).to.deep.equal(1)
                            expect(resultsFixed[0].resource_name).to.deep.equal('aws_transfer_server')
                            expect(resultsFixed[0].resource_desc).to.deep.equal('test')
                            expect(resultsFixed[0].line_number).to.deep.equal(4)
                            expect(resultsFixed[0].fixed).to.deep.equal(true)
                            if (fs.existsSync(tempFilepath)) {
                                const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                                fs.writeFileSync(filepath, data3)
                                deleteFile(tempFilepath)
                            }
                            deleteFile(EFSfilepath)
                        })
                    })
                    .catch((err) => {
                        if (fs.existsSync(tempFilepath)) {
                            const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                            fs.writeFileSync(filepath, data3)
                            deleteFile(tempFilepath)
                        }
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as transfer server is not exposed publicly as endpoint_type has wrong value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/ensure-transfer-server-is-not-exposed-publicly.test.wrong-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/ensure-transfer-server-is-not-exposed-publicly.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_transfer_server'
                        )
                        // deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled', () => {
            it('should fail as key enable_cross_zone_load_balancing has wrong value in resource: aws_lb', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(5)
                        expect(result[0].resource_name).to.deep.equal('aws_lb')
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            it('should pass as key enable_cross_zone_load_balancing is true in resource: aws_lb', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled-correct.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            it('should fail multiple resources has not', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/testTFFiles/multipleResourcesHasNot.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/testRules/hasNotMultiple2.json',
                    __dirname +
                    '/json_rules/testRules/hasNotMultiple4.json'
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                const fixedFilepath = __dirname + '/tfFiles/testTFFiles/multipleResourcesHasNot-fixed.tf'
                const tempFilepath = filepath + '-temp.tf'
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(2)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_codebuild_project'
                        )
                        expect(result[0].resource_desc).to.deep.equal('example')
                        expect(result[0].fixed).to.deep.equal(false)
                        expect(result[1].line_number).to.deep.equal(8)
                        expect(result[1].resource_name).to.deep.equal(
                            'aws_mq_broker'
                        )
                        expect(result[1].resource_desc).to.deep.equal('example')
                        expect(result[1].fixed).to.deep.equal(false)
                        const data = fs.readFileSync(filepath, {encoding: 'utf-8'})
                        fs.writeFileSync(tempFilepath, data)
                        const data2 = fs.readFileSync(fixedFilepath, {encoding: 'utf-8'})
                        fs.writeFileSync(filepath, data2)
                        event.filePath = filepath
                    }).then(() => {
                        return agentLambda(event).then((ret) => {
                            const resultString = fs.readFileSync(EFSfilepath, {
                                encoding: 'utf-8',
                            })
                            const json = JSON.parse(resultString)
                            const result = json.results
                            const resultsFixed = json.resultsFixed
                            const status = json.status
                            expect(ret).to.deep.equal(true)
                            expect(status).to.deep.equal('VIOLATION')
                            expect(result.length).to.deep.equal(0)
                            expect(resultsFixed.length).to.deep.equal(2)
                            expect(resultsFixed[0].resource_name).to.deep.equal('aws_codebuild_project')
                            expect(resultsFixed[0].resource_desc).to.deep.equal('example')
                            expect(resultsFixed[0].line_number).to.deep.equal(1)
                            expect(resultsFixed[0].fixed).to.deep.equal(true)
                            expect(resultsFixed[1].resource_name).to.deep.equal('aws_mq_broker')
                            expect(resultsFixed[1].resource_desc).to.deep.equal('example')
                            expect(resultsFixed[1].line_number).to.deep.equal(6)
                            expect(resultsFixed[1].fixed).to.deep.equal(true)
                            if (fs.existsSync(tempFilepath)) {
                                const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                                fs.writeFileSync(filepath, data3)
                                deleteFile(tempFilepath)
                            }
                            deleteFile(EFSfilepath)
                        })
                    })
                    .catch((err) => {
                        if (fs.existsSync(tempFilepath)) {
                            const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                            fs.writeFileSync(filepath, data3)
                            deleteFile(tempFilepath)
                        }
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            it('should fail bc all of them are in the resource', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/testTFFiles/testingmultiplehas_not1.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/testRules/hasNotMultiple1.json',
                ]
                
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                const fixedFilepath = __dirname + '/tfFiles/testTFFiles/testingmultiplehas_not1-fixed.tf'
                const tempFilepath = filepath + '-temp.tf'
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_codebuild_project'
                        )
                        expect(result[0].resource_desc).to.deep.equal('example')
                        expect(result[0].fixed).to.deep.equal(false)
                        const data = fs.readFileSync(filepath, {encoding: 'utf-8'})
                        fs.writeFileSync(tempFilepath, data)
                        const data2 = fs.readFileSync(fixedFilepath, {encoding: 'utf-8'})
                        fs.writeFileSync(filepath, data2)
                        event.filePath = filepath
                    }).then(() => {
                        return agentLambda(event).then((ret) => {
                            const resultString = fs.readFileSync(EFSfilepath, {
                                encoding: 'utf-8',
                            })
                            const json = JSON.parse(resultString)
                            const result = json.results
                            const resultsFixed = json.resultsFixed
                            const status = json.status
                            expect(ret).to.deep.equal(true)
                            expect(status).to.deep.equal('VIOLATION')
                            expect(result.length).to.deep.equal(0)
                            expect(resultsFixed.length).to.deep.equal(1)
                            expect(resultsFixed[0].resource_name).to.deep.equal('aws_codebuild_project')
                            expect(resultsFixed[0].resource_desc).to.deep.equal('example')
                            expect(resultsFixed[0].line_number).to.deep.equal(1)
                            expect(resultsFixed[0].fixed).to.deep.equal(true)
                            if (fs.existsSync(tempFilepath)) {
                                const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                                fs.writeFileSync(filepath, data3)
                                deleteFile(tempFilepath)
                            }
                            deleteFile(EFSfilepath)
                        })
                    })
                    .catch((err) => {
                        if (fs.existsSync(tempFilepath)) {
                            const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                            fs.writeFileSync(filepath, data3)
                            deleteFile(tempFilepath)
                        }
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            
            it('should fail as key enable_cross_zone_load_balancing does not exist in resource: aws_lb', () => {
                // Note: default value for key 'enable_cross_zone_load_balancing' is false
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled-none.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/ensure-that-load-balancer-networkgateway-has-cross-zone-load-balancing-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal('aws_lb')
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as at least one of them is false', () => {
                const filepath =
                    __dirname + '/tfFiles/testTFFiles/testingmultiplehas_not1.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/testRules/hasNotMultiple2.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal('aws_codebuild_project')
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })
        it('should not fail bc all keys are true', () => {
            const filepath =
                __dirname + '/tfFiles/testTFFiles/testingmultiplehas_not1.tf'
            const EFSfilepath = filepath + '-result.json'
            const filepathsToRules = [
                __dirname +
                '/json_rules/testRules/hasNotMultiple3.json',
            ]
            addFilesInTempDir(filepathsToRules)
            event.filePath = filepath
            event.fileName = getFileName(filepath)
            return agentLambda(event)
                .then((ret) => {
                    // Verify the rule id when an id is created
                    const resultString = fs.readFileSync(EFSfilepath, {
                        encoding: 'utf-8',
                    })
                    const json = JSON.parse(resultString)
                    const result = json.results
                    const status = json.status
                    expect(ret).to.deep.equal(true)
                    expect(status).to.deep.equal('NOVIOLATION')
                    expect(result.length).to.deep.equal(0)
                    deleteFile(EFSfilepath)
                })
                .catch((err) => {
                    deleteFile(EFSfilepath)
                    expect.fail(err.message)
                })
        })

        describe('Rule: networking_1-port-security', () => {
            it('should fail as key cidr_blocks has wrong value in resource: aws_security_group', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/networking_1-port-security.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_1-port-security.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(3)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_security_group'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key cidr_blocks has valid value in resource: aws_security_group', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/networking_1-port-security-valid-value.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_1-port-security.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key cidr_blocks does not exist in resource: aws_security_group', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/networking_1-port-security-none.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_1-port-security.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: networking_31', () => {
            it('should fail as description key does not exist in object ingress in resource: aws_security_group', () => {
                const filepath =
                    __dirname + '/tfFiles/Networking/networking_31.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_31.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(6)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_security_group'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as description key exists in object ingress in resource: aws_security_group', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/networking_31-has-key.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_31.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: networking_32', () => {
            it('should fail as default_cache_behavior.viewer_protocol_policy key has wrong value', () => {
                const filepath =
                    __dirname + '/tfFiles/Networking/networking_32.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_32.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(4)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_cloudfront_distribution'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as default_cache_behavior.viewer_protocol_policy key has a valid value (1)', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/networking_32-correct1.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_32.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as default_cache_behavior.viewer_protocol_policy key has a valid value (2)', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Networking/networking_32-correct2.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Networking/networking_32.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })
    })

    describe('STORAGE', () => {
        describe('Rule: bc_aws_s3_20', () => {
            it('should fail as key block_public_policy does not exist', () => {
                const filepath =
                    __dirname + '/tfFiles/STORAGE/bc_aws_s3_20.test.none.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Storage/bc_aws_s3_20.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(2)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_s3_bucket_public_access_block'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as key block_public_policy has wrong value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/bc_aws_s3_20.test.wrong-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Storage/bc_aws_s3_20.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_s3_bucket_public_access_block'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key block_public_policy has correct value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/bc_aws_s3_20.test.correct-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Storage/bc_aws_s3_20.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: ensure-docdb-has-audit-logs-enabled', () => {
            it('should fail as key parameter does not exist', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/ensure-docdb-has-audit-logs-enabled.test.none.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/ensure-docdb-has-audit-logs-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(3)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_docdb_cluster_parameter_group'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as key audit_logs has wrong value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/ensure-docdb-has-audit-logs-enabled.test.wrong-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/ensure-docdb-has-audit-logs-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(2)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_docdb_cluster_parameter_group'
                        )

                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key audit_logs has correct value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/ensure-docdb-has-audit-logs-enabled.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/ensure-docdb-has-audit-logs-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as key audit_logs has wrong value for both', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/ensure-docdb-has-audit-logs-enabled.test.wrong-value2.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/ensure-docdb-has-audit-logs-enabled.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(4)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_docdb_cluster_parameter_group'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: s3_13-enable-logging', () => {
            it('should fail as key logging does not exist', () => {
                const filepath =
                    __dirname + '/tfFiles/STORAGE/s3_13-enable-logging.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/s3_13-enable-logging.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(2)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_s3_bucket'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key logging exists', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/s3_13-enable-logging-correct.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/s3_13-enable-logging.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: s3_7-acl-write-permissions-aws', () => {
            it('should pass as key acl does not exist', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/s3_7-acl-write-permissions-aws-none.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/s3_7-acl-write-permissions-aws.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key has valid value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/s3_7-acl-write-permissions-aws-valid-value.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/s3_7-acl-write-permissions-aws.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should fail as key acl has value public-write', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/STORAGE/s3_7-acl-write-permissions-aws.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Storage/s3_7-acl-write-permissions-aws.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(3)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_s3_bucket'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })
    })

    describe('LOGGING', () => {
        describe('Rule: bc_aws_logging_24', () => {
            it('should fail as key access_logs.enabled has wrong value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Logging/bc_aws_logging_24.test.wrong-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Logging/bc_aws_logging_24.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(2)
                        expect(result[0].resource_name).to.deep.equal('aws_elb')
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key access_logs.enabled has correct value', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Logging/bc_aws_logging_24.test.correct-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Logging/bc_aws_logging_24.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key access_logs.enabled does not exist', () => {
                // Note: default value of access_logs.enables is true
                const filepath =
                    __dirname +
                    '/tfFiles/Logging/bc_aws_logging_24.test.none.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/Logging/bc_aws_logging_24.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(3)
                        expect(result[0].resource_name).to.deep.equal('aws_elb')
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })
    })

    describe('GENERAL', () => {
        describe('Rule: ensure-that-athena-workgroup-is-encrypted', () => {
            it('should fail as key configuration.result_configuration.encryption_configuration does not exists', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/General/ensure-that-athena-workgroup-is-encrypted.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/General/ensure-that-athena-workgroup-is-encrypted.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(3)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_athena_workgroup'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key configuration.result_configuration.encryption_configuration exists', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/General/ensure-that-athena-workgroup-is-encrypted-correct.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/General/ensure-that-athena-workgroup-is-encrypted.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        describe('Rule: ensure-that-codebuild-projects-are-encrypted', () => {
            it('should fail as key encryption_key does not exists', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/General/ensure-that-codebuild-projects-are-encrypted.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/General/ensure-that-codebuild-projects-are-encrypted.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(10)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_codebuild_project'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key encryption_key exists', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/General/ensure-that-codebuild-projects-are-encrypted-correct.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/General/ensure-that-codebuild-projects-are-encrypted.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            it('testing multiple resources - 2 violations', () => {
                const filepath =
                  __dirname + '/tfFiles/General/multipleResources-twoViols.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname +
                    '/json_rules/General/ensure-that-codebuild-projects-are-encrypted.yaml.json',
                    __dirname +
                    '/json_rules/General/ensure-that-athena-workgroup-is-encrypted.yaml.json',
                ]
                const fixedFilepath = __dirname + '/tfFiles/General/multipleResources-twoViols-fixed.tf'
                const tempFilepath = filepath + '-temp.tf'
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(2)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_athena_workgroup'
                        )
                        expect(result[1].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[1].file_path).to.deep.equal(filepath)
                        expect(result[1].line_number).to.deep.equal(9)
                        expect(result[1].resource_name).to.deep.equal(
                            'aws_codebuild_project'
                        )
                        const data = fs.readFileSync(filepath, {encoding: 'utf-8'})
                        fs.writeFileSync(tempFilepath, data)
                        const data2 = fs.readFileSync(fixedFilepath, {encoding: 'utf-8'})
                        fs.writeFileSync(filepath, data2)
                        event.filePath = filepath
                    }).then(() => {
                        return agentLambda(event).then((ret) => {
                            const resultString = fs.readFileSync(EFSfilepath, {
                                encoding: 'utf-8',
                            })
                            const json = JSON.parse(resultString)
                            const result = json.results
                            const resultsFixed = json.resultsFixed
                            const status = json.status
                            expect(ret).to.deep.equal(true)
                            expect(status).to.deep.equal('VIOLATION')
                            expect(result.length).to.deep.equal(1)
                            expect(resultsFixed.length).to.deep.equal(1)
                            expect(result[0].resource_name).to.deep.equal('aws_codebuild_project')
                            expect(result[0].resource_desc).to.deep.equal('example')
                            expect(result[0].line_number).to.deep.equal(24)
                            expect(result[0].fixed).to.deep.equal(false)
                            expect(resultsFixed[0].resource_name).to.deep.equal('aws_athena_workgroup')
                            expect(resultsFixed[0].resource_desc).to.deep.equal('test')
                            expect(resultsFixed[0].line_number).to.deep.equal(6)
                            expect(resultsFixed[0].fixed).to.deep.equal(true)
                            if (fs.existsSync(tempFilepath)) {
                                const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                                fs.writeFileSync(filepath, data3)
                                deleteFile(tempFilepath)
                            }
                            deleteFile(EFSfilepath)
                        })
                    })
                    .catch((err) => {
                        if (fs.existsSync(tempFilepath)) {
                            const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                            fs.writeFileSync(filepath, data3)
                            deleteFile(tempFilepath)
                        }
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })

        it('testing multiple deleted resources - 2 violations', () => {
            const filepath =
              __dirname + '/tfFiles/General/multipleResourcesDel-twoViols.tf'
            const EFSfilepath = filepath + '-result.json'
            const filepathsToRules = [
                __dirname +
                '/json_rules/General/ensure-that-codebuild-projects-are-encrypted.yaml.json',
                __dirname +
                '/json_rules/General/ensure-that-athena-workgroup-is-encrypted.yaml.json',
            ]
            addFilesInTempDir(filepathsToRules)
            event.filePath = filepath
            event.fileName = getFileName(filepath)
            const fixedFilepath = __dirname + '/tfFiles/General/multipleResourcesDel-twoViols-fixed.tf'
            const tempFilepath = filepath + '-temp.tf'
            return agentLambda(event)
                .then((ret) => {
                    // Verify the rule id when an id is created
                    const resultString = fs.readFileSync(EFSfilepath, {
                        encoding: 'utf-8',
                    })
                    const json = JSON.parse(resultString)
                    const result = json.results
                    const status = json.status
                    expect(ret).to.deep.equal(true)
                    expect(status).to.deep.equal('VIOLATION')
                    expect(result.length).to.deep.equal(2)
                    expect(result[0].file_path).to.deep.equal(filepath)
                    expect(result[0].line_number).to.deep.equal(1)
                    expect(result[0].resource_name).to.deep.equal(
                        'aws_athena_workgroup'
                    )
                    expect(result[1].file_path).to.deep.equal(filepath)
                    expect(result[1].line_number).to.deep.equal(9)
                    expect(result[1].resource_name).to.deep.equal(
                        'aws_codebuild_project'
                    )
                    const data = fs.readFileSync(filepath, {encoding: 'utf-8'})
                    fs.writeFileSync(tempFilepath, data)
                    const data2 = fs.readFileSync(fixedFilepath, {encoding: 'utf-8'})
                    fs.writeFileSync(filepath, data2)
                    event.filePath = filepath
                }).then(() => {
                    return agentLambda(event).then((ret) => {
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const resultsFixed = json.resultsFixed
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(resultsFixed.length).to.deep.equal(2)
                        expect(result[0].resource_name).to.deep.equal('aws_athena_workgroup')
                        expect(result[0].resource_desc).to.deep.equal('test2')
                        expect(result[0].line_number).to.deep.equal(1)
                        expect(result[0].fixed).to.deep.equal(false)
                        expect(resultsFixed[0].resource_name).to.deep.equal('aws_athena_workgroup')
                        expect(resultsFixed[0].resource_desc).to.deep.equal('test')
                        expect(resultsFixed[0].line_number).to.deep.equal(1)
                        expect(resultsFixed[0].fixed).to.deep.equal(true)
                        expect(resultsFixed[1].resource_name).to.deep.equal('aws_codebuild_project')
                        expect(resultsFixed[1].resource_desc).to.deep.equal('example')
                        expect(resultsFixed[1].line_number).to.deep.equal(9)
                        expect(resultsFixed[1].fixed).to.deep.equal(true)
                        if (fs.existsSync(tempFilepath)) {
                            const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                            fs.writeFileSync(filepath, data3)
                            deleteFile(tempFilepath)
                        }
                        deleteFile(EFSfilepath)
                    })
                })
                .catch((err) => {
                    if (fs.existsSync(tempFilepath)) {
                        const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                        fs.writeFileSync(filepath, data3)
                        deleteFile(tempFilepath)
                    }
                    deleteFile(EFSfilepath)
                    expect.fail(err.message)
                })
        })
        it('testing multiple resources - some violations', () => {
            const filepath =
                __dirname + '/tfFiles/General/multipleResourcesSomeViols.tf'
            const EFSfilepath = filepath + '-result.json'
            const filepathsToRules = [
                __dirname +
                '/json_rules/General/ensure-that-codebuild-projects-are-encrypted.yaml.json',
                __dirname +
                '/json_rules/General/ensure-that-athena-workgroup-is-encrypted.yaml.json',
            ]
            addFilesInTempDir(filepathsToRules)
            event.filePath = filepath
            event.fileName = getFileName(filepath)
            const fixedFilepath = __dirname + '/tfFiles/General/multipleResourcesSomeViols-fix.tf'
            const tempFilepath = filepath + '-temp.tf'
            return agentLambda(event)
                .then((ret) => {
                    // Verify the rule id when an id is created
                    const resultString = fs.readFileSync(EFSfilepath, {
                        encoding: 'utf-8',
                    })
                    const json = JSON.parse(resultString)
                    const result = json.results
                    const status = json.status
                    expect(ret).to.deep.equal(true)
                    expect(status).to.deep.equal('VIOLATION')
                    expect(result.length).to.deep.equal(2)
                    expect(result[0].file_path).to.deep.equal(filepath)
                    expect(result[0].line_number).to.deep.equal(1)
                    expect(result[0].resource_name).to.deep.equal(
                        'aws_athena_workgroup'
                    )
                    expect(result[0].resource_desc).to.deep.equal('test')
                    expect(result[0].fixed).to.deep.equal(false)
                    expect(result[1].file_path).to.deep.equal(filepath)
                    expect(result[1].line_number).to.deep.equal(36)
                    expect(result[1].resource_name).to.deep.equal(
                        'aws_codebuild_project'
                    )
                    expect(result[1].resource_desc).to.deep.equal('testingthis')
                    expect(result[1].fixed).to.deep.equal(false)
                    const data = fs.readFileSync(filepath, {encoding: 'utf-8'})
                    fs.writeFileSync(tempFilepath, data)
                    const data2 = fs.readFileSync(fixedFilepath, {encoding: 'utf-8'})
                    fs.writeFileSync(filepath, data2)
                    event.filePath = filepath
                }).then(() => {
                    return agentLambda(event).then((ret) => {
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const resultsFixed = json.resultsFixed
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(0)
                        expect(resultsFixed.length).to.deep.equal(2)
                        expect(resultsFixed[0].resource_name).to.deep.equal('aws_athena_workgroup')
                        expect(resultsFixed[0].resource_desc).to.deep.equal('test')
                        expect(resultsFixed[0].line_number).to.deep.equal(1)
                        expect(resultsFixed[0].fixed).to.deep.equal(true)
                        expect(resultsFixed[1].resource_name).to.deep.equal('aws_codebuild_project')
                        expect(resultsFixed[1].resource_desc).to.deep.equal('testingthis')
                        expect(resultsFixed[1].line_number).to.deep.equal(40)
                        expect(resultsFixed[1].fixed).to.deep.equal(true)
                        if (fs.existsSync(tempFilepath)) {
                            const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                            fs.writeFileSync(filepath, data3)
                            deleteFile(tempFilepath)
                        }
                        deleteFile(EFSfilepath)
                    })
                })
                .catch((err) => {
                    if (fs.existsSync(tempFilepath)) {
                        const data3 = fs.readFileSync(tempFilepath, {encoding: 'utf-8'})
                        fs.writeFileSync(filepath, data3)
                        deleteFile(tempFilepath)
                    }
                    deleteFile(EFSfilepath)
                    expect.fail(err.message)
                })
        })
    })
    

    describe('PUBLIC', () => {
        describe('Rule: public_11', () => {
            it('should fail as key publicly_accessible does not exists', () => {
                const filepath =
                    __dirname + '/tfFiles/Public/public_11.test.none.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Public/public_11.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(2)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_mq_broker'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
            

            it('should fail as key publicly_accessible has wrong value', () => {
                const filepath =
                    __dirname + '/tfFiles/Public/public_11.test.wrong-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Public/public_11.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(14)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_mq_broker'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key encryption_key exists with value true', () => {
                const filepath =
                    __dirname +
                    '/tfFiles/Public/public_11.test.correct-value.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Public/public_11.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })
    })

    describe('SECRETS', () => {
        describe('Rule: bc_aws_secrets', () => {
            it('should fail as key user_data exists', () => {
                const filepath =
                    __dirname + '/tfFiles/Secrets/bc_aws_secrets.test.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Secrets/bc_aws_secrets.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('VIOLATION')
                        expect(result.length).to.deep.equal(1)
                        expect(result[0].repo_name).to.deep.equal(
                            'TerraScanTestData'
                        )
                        expect(result[0].file_path).to.deep.equal(filepath)
                        expect(result[0].line_number).to.deep.equal(4)
                        expect(result[0].resource_name).to.deep.equal(
                            'aws_instance'
                        )
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })

            it('should pass as key user_data does not exists', () => {
                const filepath =
                    __dirname + '/tfFiles/Secrets/bc_aws_secrets.test.none.tf'
                const EFSfilepath = filepath + '-result.json'
                const filepathsToRules = [
                    __dirname + '/json_rules/Secrets/bc_aws_secrets.yaml.json',
                ]
                addFilesInTempDir(filepathsToRules)
                event.filePath = filepath
                event.fileName = getFileName(filepath)
                return agentLambda(event)
                    .then((ret) => {
                        // Verify the rule id when an id is created
                        const resultString = fs.readFileSync(EFSfilepath, {
                            encoding: 'utf-8',
                        })
                        const json = JSON.parse(resultString)
                        const result = json.results
                        const status = json.status
                        expect(ret).to.deep.equal(true)
                        expect(status).to.deep.equal('NOVIOLATION')
                        expect(result.length).to.deep.equal(0)
                        deleteFile(EFSfilepath)
                    })
                    .catch((err) => {
                        deleteFile(EFSfilepath)
                        expect.fail(err.message)
                    })
            })
        })
    })
})
