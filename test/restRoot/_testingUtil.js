const { expect } = require('chai')

// for database
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// filepaths
const glob = require('glob')

// json web tokens
const jwt = require('jsonwebtoken')

const jwt_test_secret = 'unittest'

exports.setup = {}
exports.setup.db = async function (database_name) {
    process.env.PGUSER = 'postgres'
    process.env.PGPASSWORD = 'unittest'
    process.env.PGDATABASE = database_name
    process.env.PGHOST = 'localhost'
    process.env.PGPORT = '5433'
    process.env.JWT_SECRET = jwt_test_secret

    // drop and/or create the unit test database
    let client = new Client({ database: 'postgres' })
    await client.connect()
    await client.query(`DROP DATABASE IF EXISTS ${process.env.PGDATABASE};`)
    await client.query(`CREATE DATABASE ${process.env.PGDATABASE};`)
    await client.end()

    // connect to unit test database
    client = new Client()
    await client.connect()
    const sql = fs
        .readFileSync(
            path.resolve(__dirname, '../../database/definition.sql'),
            'utf8'
        )
        .toString()
    await client.query(sql)
    await client.end()
}

exports.setup.dbData = async function () {
    const client = new Client()
    await client.connect()
    const test_data = fs
        .readFileSync(
            path.resolve(__dirname, '../postgres/testing_data.sql'),
            'utf8'
        )
        .toString()
    await client.query(test_data)
    await client.end()
}

exports.setup.jwt = function () {
    process.env.JWT_SECRET = jwt_test_secret

    // create jwts for testing
    return {
        // for admin tests
        adm: jwt.sign(
            {
                usr: 'test@test.com',
                ghb: 'testing',
                adm: true,
            },
            // for now it's stored in an environment variable, for
            // production use it can be stored as a secret in AWS
            process.env.JWT_SECRET,
            {
                expiresIn: 60 * 60 * 24 * 90, // 90 days
            }
        ),

        // for user side
        usr: jwt.sign(
            {
                usr: 'test2@test.com',
                ghb: 'testing2',
                adm: false,
            },
            // for now it's stored in an environment variable, for
            // production use it can be stored as a secret in AWS
            process.env.JWT_SECRET,
            {
                expiresIn: 60 * 60 * 24 * 90, // 90 days
            }
        ),

        // for user side
        with_no_github: jwt.sign(
            {
                usr: 'test2@test.com',
                adm: false,
            },
            // for now it's stored in an environment variable, for
            // production use it can be stored as a secret in AWS
            process.env.JWT_SECRET,
            {
                expiresIn: 60 * 60 * 24 * 90, // 90 days
            }
        ),
    }
}

exports.setup.deleteCaches = function () {
    return new Promise((resolve, reject) => {
        glob(
            path.resolve('amplify/backend/function/restRoot/src/**/*'),
            (err, files) => {
                if (err) return reject(err)

                for (const file of files) {
                    if (file.includes('/node_modules/') || !file.endsWith('.js')) continue

                    delete require.cache[require.resolve(file)]
                }
                resolve()
            }
        )
    })
}

exports.expectViolationResult = function (obj) {
    expect(obj).to.have.property('pull_url')
    expect(obj).to.have.property('file_path')
    expect(obj).to.have.property('line_number')
    expect(obj).to.have.property('resource_name')
    expect(obj).to.have.property('timestamp_found')
    expect(obj).to.have.property('timestamp_fixed')
    expect(obj).to.have.property('rule_id')
    expect(obj).to.have.property('github_username')
}
