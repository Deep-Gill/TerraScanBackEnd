// testing libraries
// mocha
const { describe, it} = require('mocha')

// chai
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)

const parser = require('../../terraform/index').TerraformToJSON
const getLineNumber = require('../../terraform/index').getLineNumber

describe('parsing terraform files', () => {
    const filepath1 = __dirname + '/data/main.tf'
    const filepath2 = __dirname + '/data/m3-data2.tf'
    const filepath3 = __dirname + '/data/kali_ec2.tf'
    const filepath4 = __dirname + '/data/AWSmain.tf'

    describe('parsing hcl to json', () => {

        it('should parse resources in main.tf to json', async () => {
            const resources = parser(filepath1)

            expect(Object.keys(resources)).to.include('aws_ebs_volume')
            expect(Object.keys(resources)).to.include('aws_volume_attachment')
            expect(Object.keys(resources).length).to.equal(2)

            expect(Object.keys(resources.aws_ebs_volume.main).length).to.equal(5)
            expect(resources.aws_ebs_volume.main.availability_zone).to.equal('${var.az}')
            expect(resources.aws_ebs_volume.main.type).to.equal('${var.volume_type}')
            expect(resources.aws_ebs_volume.main.size).to.equal('${var.size}')
            expect(resources.aws_ebs_volume.main.encrypted).to.equal(true)
            expect(resources.aws_ebs_volume.main.lifecycle.prevent_destroy).to.equal(true)
            expect(Object.keys(resources.aws_ebs_volume.main.lifecycle).length).to.equal(1)

            expect(Object.keys(resources.aws_volume_attachment.main).length).to.equal(5)
            expect(resources.aws_volume_attachment.main.device_name).to.equal('${var.external_device_name}')
            expect(resources.aws_volume_attachment.main.volume_id).to.equal('${aws_ebs_volume.main.id}')
            expect(resources.aws_volume_attachment.main.instance_id).to.equal('${var.instance_id}')
            expect(resources.aws_volume_attachment.main.skip_destroy).to.equal(true)
            expect(resources.aws_volume_attachment.main.provisioner.length).to.equal(3)

            expect(resources.aws_volume_attachment.main.provisioner[0]).to.have.all.keys('file')
            expect(resources.aws_volume_attachment.main.provisioner[0].file.source).to.equal('${path.module}/files/attach-data-volume.sh')
            expect(resources.aws_volume_attachment.main.provisioner[0].file.destination).to.equal('${local.script_dest}')
            expect(Object.keys(resources.aws_volume_attachment.main.provisioner[0].file).length).to.equal(2)

            expect(resources.aws_volume_attachment.main.provisioner[1]).to.have.all.keys('remote-exec')
            expect(resources.aws_volume_attachment.main.provisioner[1]['remote-exec'].inline[0]).to.equal('chmod +x ${local.script_dest}')
            expect(resources.aws_volume_attachment.main.provisioner[1]['remote-exec'].inline.length).to.equal(1)
            expect(Object.keys(resources.aws_volume_attachment.main.provisioner[1]['remote-exec']).length).to.equal(1)

            expect(resources.aws_volume_attachment.main.provisioner[2]).to.have.all.keys('remote-exec')
            expect(resources.aws_volume_attachment.main.provisioner[2]['remote-exec'].tags.Environment).to.equal('${var.environment}')
            expect(Object.keys(resources.aws_volume_attachment.main.provisioner[2]['remote-exec']).length).to.equal(1)
            expect(Object.keys(resources.aws_volume_attachment.main.provisioner[2]['remote-exec'].tags).length).to.equal(1)

        })

    })

    describe ('should get the right line numbers', () => {

        it ('should return line number of resource: aws_volume_attachment main, from main.tf', async () => {
            return getLineNumber(filepath1, 'aws_volume_attachment', 'main').then((lineNum) => {
                expect(lineNum).to.equal(20)
            }).catch((err) => {
                expect.fail(err.message)
            })
        })

        it ('should return line number of resource: aws_transfer_server test', async () => {
            const filepath5 = __dirname + '/tfFiles/Networking/ensure-transfer-server-is-not-exposed-publicly.test.wrong-value.tf'
            return getLineNumber(filepath5, 'aws_transfer_server', 'test').then((lineNum) => {
                expect(lineNum).to.equal(1)
            }).catch((err) => {
                expect.fail(err.message)
            })
        })

        it('should return line number of resource: aws_s3_bucket_object m3-data2-service-file, from m3-data2.tf', async () => {
            return getLineNumber(filepath2, 'aws_s3_bucket_object', 'm3-data2-service-file').then((lineNum) => {
                expect(lineNum).to.equal(70)
            }).catch((err) => {
                expect.fail(err.message)
            })
        })

        it ('should return line number of resource: aws_eip kali, from kali_ec2.tf', async () => {
            return getLineNumber(filepath3, 'aws_eip', 'kali').then((lineNum) => {
                expect(lineNum).to.equal(48)
            }).catch((err) => {
                expect.fail(err.message)
            })
        }) 

        it ('should return line number of resource: aws_ebs_volume main, from main.tf', async () => {
            return getLineNumber(filepath1, 'aws_ebs_volume', 'main').then((lineNum) => {
                expect(lineNum).to.equal(1)
            }).catch((err) => {
                expect.fail(err.message)
            })
        }) 

        it ('should return line number of resource: aws_ebs_volume this, from AWSmain.tf', async () => {
            return getLineNumber(filepath4, 'aws_ebs_volume', 'this').then((lineNum) => {
                expect(lineNum).to.equal(84)
            }).catch((err) => {
                expect.fail(err.message)
            })
        }) 

    }) 
    
})