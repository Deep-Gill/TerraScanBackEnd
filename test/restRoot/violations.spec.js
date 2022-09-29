// testing libraries
// mocha
const { describe, it, before, after } = require('mocha')

// chai
const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')

// express app
let app

// testing util
const util = require('./_testingUtil')

chai.use(chaiHttp)

describe('restRoot violations endpoints', () => {
    const tokens = util.setup.jwt()
    before(async () => {
        await util.setup.deleteCaches()
        app = require('../../amplify/backend/function/restRoot/src/app')

        await util.setup.db('unittest_violations')
        await util.setup.dbData()
    })

    after(async () => {
        await app.server.close()
    })

    describe('GET /violations', () => {
        it('should be able to get all violations as an admin', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query()

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.have.length(3)

            util.expectViolationResult(res.body[0])
        })

        it('should not be able to get all violations as a regular user', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.usr}` })
                .query()

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.have.length(1)

            util.expectViolationResult(res.body[0])
        })

        it('a user should be able to get their own violations', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.usr}` })
                .query()

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.have.length(1)
            expect(res.body).to.deep.equal([
                {
                    id: 2,
                    repo_name: 'CPSC-319/TerraScanBackEnd',
                    pull_url:
                        'https://github.com/CPSC-319/TerraScanBackEnd/pull/2',
                    file_path: 'terraform/example.tf',
                    line_number: 10,
                    resource_name: 'example_resource',
                    timestamp_found: '2021-10-14T19:26:16.215Z',
                    timestamp_fixed: null,
                    rule_id: 1,
                    github_username: 'testing2',
                    severity: 0,
                },
            ])
        })

        it('should not be able to get the violations with an invalid jwt', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: 'Bearer 123' })
                .query()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })

        it('should be possible for an admin to query by github_username', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query({ user: 'testing2' })

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.have.length(1)
            expect(res.body).to.deep.equal([
                {
                    id: 2,
                    repo_name: 'CPSC-319/TerraScanBackEnd',
                    pull_url:
                        'https://github.com/CPSC-319/TerraScanBackEnd/pull/2',
                    file_path: 'terraform/example.tf',
                    line_number: 10,
                    resource_name: 'example_resource',
                    timestamp_found: '2021-10-14T19:26:16.215Z',
                    timestamp_fixed: null,
                    rule_id: 1,
                    github_username: 'testing2',
                    severity: 0,
                },
            ])
        })

        it('should be possible for an admin to query by repo', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query({ repo: 'CPSC-319/TerraScanBackEnd' })

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.have.length(2)
            expect(res.body).to.deep.equal([
                {
                    id: 1,
                    repo_name: 'CPSC-319/TerraScanBackEnd',
                    pull_url:
                        'https://github.com/CPSC-319/TerraScanBackEnd/pull/1',
                    file_path: 'terraform/example.tf',
                    line_number: 10,
                    resource_name: 'example_resource',
                    timestamp_found: '2021-10-14T19:26:16.215Z',
                    timestamp_fixed: '2021-10-16T21:40:50.675Z',
                    rule_id: 1,
                    github_username: 'testing',
                    severity: 0,
                },
                {
                    id: 2,
                    repo_name: 'CPSC-319/TerraScanBackEnd',
                    pull_url:
                        'https://github.com/CPSC-319/TerraScanBackEnd/pull/2',
                    file_path: 'terraform/example.tf',
                    line_number: 10,
                    resource_name: 'example_resource',
                    timestamp_found: '2021-10-14T19:26:16.215Z',
                    timestamp_fixed: null,
                    rule_id: 1,
                    github_username: 'testing2',
                    severity: 0,
                },
            ])
        })

        it('should be possible for an admin to query by pull request', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query({
                    pull_request:
                        'https://github.com/CPSC-319/TerraScanBackEnd/pull/2',
                })

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.have.length(1)
            expect(res.body).to.deep.equal([
                {
                    id: 2,
                    repo_name: 'CPSC-319/TerraScanBackEnd',
                    pull_url:
                        'https://github.com/CPSC-319/TerraScanBackEnd/pull/2',
                    file_path: 'terraform/example.tf',
                    line_number: 10,
                    resource_name: 'example_resource',
                    timestamp_found: '2021-10-14T19:26:16.215Z',
                    timestamp_fixed: null,
                    rule_id: 1,
                    github_username: 'testing2',
                    severity: 0,
                },
            ])
        })

        it('should fail for a jwt with no ghb field', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations')
                .set({ Authorization: `Bearer ${tokens.with_no_github}` })
                .query()

            expect(res.status).to.equal(400)
            expect(res.body).to.not.be.empty
            expect(res.body.error).to.equal('JWT_ERROR')
        })

        it('should deny an unauthenticated user', async () => {
            const res = await chai.request(app).get('/v1/violations').query()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })
    })

    describe('GET /violations/aggregated', () => {
        it('should deny unauthenticated users', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations/aggregated')
                .query()

            expect(res.status).to.equal(401)
            expect(res.body).to.be.empty
        })

        it('should deny non-admin users', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations/aggregated')
                .set({ Authorization: `Bearer ${tokens.usr}` })
                .query()

            expect(res.status).to.equal(403)
            expect(res.body).to.be.empty
        })

        it('should return a count per repo', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations/aggregated')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query({
                    type: 'count-per-repo',
                })

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.deep.equal([
                { repo_name: 'CPSC-319/TerraScanBackEnd', count: '2' },
                { repo_name: 'CPSC-319/TerraScanFrontEnd', count: '1' },
            ])
        })

        it('should return a top 10 rules violated', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations/aggregated')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query({
                    type: 'top10',
                })

            expect(res.status).to.equal(200)
            expect(res.body).to.not.be.empty
            expect(res.body).to.deep.equal([
                { rule_id: 1, description: 'rule 1', count: '2' },
                { rule_id: 2, description: 'rule two', count: '1' },
            ])
        })

        it('should complain about missing parameters', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations/aggregated')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query()

            expect(res.status).to.equal(400)
            expect(res.body).to.not.be.empty
            expect(res.body.error).to.equal('MISSING_PARAMETERS')
        })

        it('should complain about invalid parameters', async () => {
            const res = await chai
                .request(app)
                .get('/v1/violations/aggregated')
                .set({ Authorization: `Bearer ${tokens.adm}` })
                .query({type: 'non-existing'})

            expect(res.status).to.equal(400)
            expect(res.body).to.not.be.empty
            expect(res.body.error).to.equal('INVALID_PARAMETERS')
        })
    })
})
