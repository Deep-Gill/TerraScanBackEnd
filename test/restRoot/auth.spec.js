// testing libraries
// mocha
const { describe, it, before, after, afterEach } = require('mocha')

// chai
const chai = require('chai')
const expect = chai.expect
const chaiHttp = require('chai-http')

// for database
const { Client } = require('pg')

// express app
let app

// testing util
const util = require('./_testingUtil')

chai.use(chaiHttp)

describe('restRoot auth endpoints', () => {
    before(async () => {
        await util.setup.deleteCaches()
        app = require('../../amplify/backend/function/restRoot/src/app')

        await util.setup.db('unittest_auth')
    })

    after(async () => {
        await app.server.close()
    })

    describe('POST /auth/user', () => {
        afterEach(async () => {
            const client = new Client()
            await client.connect()
            await client.query('DELETE FROM users;')
            await client.end()
        })

        it('should create a user', async () => {
            const res = await chai.request(app).post('/v1/auth/user').send({
                email: 'test@test.com',
                password: '1234',
                github: 'testing',
            })

            expect(res.status).to.equal(201)
            expect(res.body).to.be.empty
        })

        it('should fail to create user with an invalid email', async () => {
            const res = await chai.request(app).post('/v1/auth/user').send({
                email: 'test not an email',
                password: '1234',
                github: 'testing2',
            })

            expect(res.status).to.equal(400)
            expect(res.body.error).to.equal('INVALID_EMAIL')
        })

        it('should fail to create user with duplicate email', async () => {
            let res = await chai.request(app).post('/v1/auth/user').send({
                email: 'test@test.com',
                password: '1234',
                github: 'testing',
            })

            expect(res.status).to.equal(201)
            expect(res.body).to.be.empty

            res = await chai.request(app).post('/v1/auth/user').send({
                email: 'test@test.com',
                password: '1234',
                github: 'testing2',
            })

            expect(res.status).to.equal(400)
            expect(res.body.error).to.equal('DUPLICATE_USER')
        })

        it('should fail to create user with duplicate github', async () => {
            let res = await chai.request(app).post('/v1/auth/user').send({
                email: 'test@test.com',
                password: '1234',
                github: 'testing',
            })

            expect(res.status).to.equal(201)
            expect(res.body).to.be.empty

            res = await chai.request(app).post('/v1/auth/user').send({
                email: 'test2@test.com',
                password: '1234',
                github: 'testing',
            })

            expect(res.status).to.equal(400)
            expect(res.body.error).to.equal('DUPLICATE_USER')
        })

        it('should not accept missing fields', async () => {
            const cases = [
                {
                    email: 'test@test.com',
                    password: '1234',
                },
                {
                    password: '1234',
                    github: 'testing',
                },
                {
                    email: 'test@test.com',
                    github: 'testing',
                },
            ]

            for await (const testCase of cases) {
                const res = await chai
                    .request(app)
                    .post('/v1/auth/user')
                    .send(testCase)

                expect(res.status).to.equal(400)
                expect(res.body.error).to.equal('MISSING_PARAMETERS')
            }
        })
    })

    describe('POST /auth/login', () => {
        before(async () => {
            await chai.request(app).post('/v1/auth/user').send({
                email: 'test@test.com',
                password: '1234',
                github: 'testing',
            })
        })

        after(async () => {
            const client = new Client()
            await client.connect()
            await client.query('DELETE FROM users;')
            await client.end()
        })

        it('should correctly login', async () => {
            const res = await chai.request(app).post('/v1/auth/login').send({
                email: 'test@test.com',
                password: '1234',
            })

            expect(res.status).to.equal(200)
            expect(res?.body?.auth_token).to.be.a('string')
        })

        it('should not login with the wrong password', async () => {
            const res = await chai.request(app).post('/v1/auth/login').send({
                email: 'test@test.com',
                password: '12345',
            })

            expect(res.status).to.equal(400)
            expect(res.body.error).to.equal('WRONG_PASSWORD')
        })

        it('should not login with the wrong email', async () => {
            const res = await chai.request(app).post('/v1/auth/login').send({
                email: 'test2@test.com',
                password: '1234',
            })

            expect(res.status).to.equal(400)
            expect(res.body.error).to.equal('WRONG_EMAIL')
        })

        it('should not accept missing fields', async () => {
            const cases = [
                {
                    email: 'test@test.com',
                },
                {
                    email: 'test@test.com',
                },
            ]

            for await (const testCase of cases) {
                const res = await chai
                    .request(app)
                    .post('/v1/auth/login')
                    .send(testCase)

                expect(res.status).to.equal(400)
                expect(res.body.error).to.equal('MISSING_PARAMETERS')
            }
        })
    })
})
