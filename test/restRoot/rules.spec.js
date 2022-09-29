// testing libraries
// mocha
const { describe, it, before, after } = require('mocha')

// chai
const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')

// db
const { Client } = require('pg')

// filepaths
const glob = require('glob')
const fs = require('fs')
const path = require('path')

// yaml
const YAML = require('yaml')

// express app
let app

// testing util
const util = require('./_testingUtil')

chai.use(chaiHttp)

describe('restRoot rules endpoints', () => {
    const tokens = util.setup.jwt()
    before(async () => {
        await util.setup.deleteCaches()
        app = require('../../amplify/backend/function/restRoot/src/app')

        await util.setup.db('unittest_rules')
        await util.setup.dbData()
    })

    after(async () => {
        await app.server.close()
    })

    describe('GET /rules', () => {
        it('should be able to get the rules as an admin', async () => {
            const res = await chai
                .request(app)
                .get('/v1/rules')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query()

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body[0]).to.have.property('id')
            expect(res.body[0]).to.have.property('description')
            expect(res.body[0]).to.have.property('yaml_file')
            expect(res.body[0]).to.have.property('created')
            expect(res.body[0]).to.have.property('last_modified')
            expect(res.body[0]).to.have.property('severity')
            expect(res.body[0]).to.have.property('category')
        })

        it('should not be able to get the rules as a regular user', async () => {
            const res = await chai
                .request(app)
                .get('/v1/rules')
                .set({ Authorization: `Bearer ${tokens.usr}` })
                .query()

            expect(res.status).to.equal(403)
            expect(res.body).to.be.empty
        })

        it('should not be able to get the rules while unauthenticated', async () => {
            const res = await chai.request(app).get('/v1/rules').query()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })

        it('should not be able to get the rules with an invalid jwt', async () => {
            const res = await chai
                .request(app)
                .get('/v1/rules')
                .set({ Authorization: 'Bearer 123' })
                .query()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })
    })

    describe('POST /rules', () => {
        it('should be able to post valid rules as an admin', async () => {
            const cases = await new Promise((resolve, reject) => {
                glob(
                    path.resolve('test/restRoot/rule_yamls/valid_rules/*'),
                    (err, files) => {
                        if (err) return reject(err)

                        const res = []
                        for (const file of files) {
                            res.push({
                                name: file,
                                file: fs.readFileSync(file).toString()
                            })
                        }
                        resolve(res)
                    }
                )
            })

            for await (const yaml_file of cases) {
                const testCase = {
                    description: 'test case rule',
                    yaml_file: yaml_file.file,
                }
                let res = await chai
                    .request(app)
                    .post('/v1/rules')
                    .set({ Authorization: `Bearer ${tokens.adm}` })
                    .send(testCase)

                expect(res.status).to.equal(201, `failed valid file ${yaml_file.name}`)
                expect(res.body).to.not.be.empty
                expect(res.body).to.have.property('id')
                expect(res.body.id).to.be.a('Number', `failed valid file ${yaml_file.name}`)

                const id = res.body.id

                res = await chai
                    .request(app)
                    .get('/v1/rules/' + id)
                    .set({ Authorization: `Bearer ${tokens.adm}` })
                    .query()

                expect(res.status).to.equal(200)
                expect(res.body).to.not.be.empty

                expect(YAML.parse(res?.body[0]?.yaml_file)).to.deep.equal(
                    YAML.parse(testCase.yaml_file)
                )
            }
        })

        it('should require the required parameters', async () => {
            const cases = [
                {},
                { description: 'test case rule' },
                { yaml_file: 'testing: true' },
            ]

            for await (const testCase of cases) {
                const res = await chai
                    .request(app)
                    .post('/v1/rules')
                    .set({ Authorization: `Bearer ${tokens.adm}` })
                    .send(testCase)

                expect(res.status).to.equal(400)
                expect(res.body.error).to.equal('MISSING_PARAMETERS')
            }
        })

        it('should not accept invalid rules', async () => {
            const cases = await new Promise((resolve, reject) => {
                glob(
                    path.resolve('test/restRoot/rule_yamls/invalid_rules/*'),
                    (err, files) => {
                        if (err) return reject(err)

                        const res = []
                        for (const file of files) {
                            res.push({
                                name: file,
                                file: fs.readFileSync(file).toString()
                            })
                        }
                        resolve(res)
                    }
                )
            })

            for await (const testCase of cases) {
                const res = await chai
                    .request(app)
                    .post('/v1/rules')
                    .set({ Authorization: `Bearer ${tokens.adm}` })
                    .send({
                        description: 'invalid test case x',
                        yaml_file: testCase.file,
                    })

                expect(res.status).to.equal(400, `failed invalid file ${testCase.name}`)
                expect(res.body.error).to.equal('INVALID_RULE', `failed invalid file ${testCase.name}`)
            }
        })

        it('should not be able to post a rule as a regular user', async () => {
            const res = await chai
                .request(app)
                .post('/v1/rules')
                .set({ Authorization: `Bearer ${tokens.usr}` })
                .send()

            expect(res.status).to.equal(403)
            expect(res.body).to.be.empty
        })

        it('should be able to enable a rule as an admin', async () => {
            const client = new Client()
            await client.connect()
            await client.query('UPDATE rules SET enabled = false WHERE id = 9')

            const res = await chai
                .request(app)
                .put('/v1/rules/enable/9')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .send()

            expect(res.status).to.equal(200)
            expect(res.body).to.be.empty

            const dbres = await client.query('SELECT * FROM rules WHERE id = 9')
            await client.end()

            expect(dbres.rows[0].id).to.equal(9)
            expect(dbres.rows[0].enabled).to.equal(true)
        })

        it('should be able to disable a rule as an admin', async () => {
            const client = new Client()
            await client.connect()
            await client.query('UPDATE rules SET enabled = true WHERE id = 3')

            const res = await chai
                .request(app)
                .put('/v1/rules/disable/3')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .send()

            expect(res.status).to.equal(200)
            expect(res.body).to.be.empty

            const dbres = await client.query('SELECT * FROM rules WHERE id = 3')
            await client.end()

            expect(dbres.rows[0].id).to.equal(3)
            expect(dbres.rows[0].enabled).to.equal(false)
        })

        it('should not accept invalid yaml files', async () => {
            const testCase = {
                description: 'test case rule',

                // invalid because of indentation
                yaml_file: ' testing: true\ntesting2:true',
            }
            const res = await chai
                .request(app)
                .post('/v1/rules')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .send(testCase)

            expect(res.status).to.equal(400)
            expect(res.body.error).to.equal('INVALID_YAML')
        })

        it('should not be able to post a rule while unauthenticated', async () => {
            const res = await chai.request(app).post('/v1/rules').send()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })

        it('should not be able to post a rule with an invalid jwt', async () => {
            const res = await chai
                .request(app)
                .post('/v1/rules')
                .set({ Authorization: 'Bearer 123' })
                .send()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })

        it('should not be able to post a rule without a bearer token', async () => {
            const res = await chai
                .request(app)
                .post('/v1/rules')
                .set({ Authorization: '123' })
                .send()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })

        it('should be able to delete a rule as an admin', async () => {
            const client = new Client()
            await client.connect()
            let dbres = await client.query('SELECT * FROM rules WHERE id = 8')
            expect(dbres.rows[0]).to.be.an('Object')

            const res = await chai
                .request(app)
                .delete('/v1/rules/8')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .send()

            dbres = await client.query('SELECT * FROM rules WHERE id = 8')
            await client.end()

            expect(dbres.rows).to.be.empty

            expect(res.status).to.equal(200)
            expect(res.body).to.be.empty
        })
    })
})
