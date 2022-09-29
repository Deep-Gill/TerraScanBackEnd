const errorResponse = require('../util').errorResponse

const express = require('express')
const router = express.Router()

// database connection
const pool = require('../db')

// bcrypt password hasher
const bcrypt = require('bcryptjs')

// json web tokens
const jwt = require('jsonwebtoken')

// email validator
const email_validator = require('email-validator')
function validate_email(email) {
    return email_validator.validate(email)
}

router.post('/user', async (req, res) => {
    // verify required parameters
    if (!req.body.email || !req.body.password || !req.body.github) {
        res.status(400).json(errorResponse('MISSING_PARAMETERS'))
        return
    }

    if (!validate_email(req.body.email.trim())) {
        res.status(400).json(errorResponse('INVALID_EMAIL'))
        return
    }

    bcrypt // hash the password
        // 2^12 rounds is more secure, but during my testing that would
        // take 5-7 seconds on lambda, so we're only using 2^10
        .hash(req.body.password, 10) // 2^10 rounds
        .then((hashed_password) => {
            pool.query(
                'INSERT INTO users (email, github_username, password) VALUES ($1, $2, $3)',
                [req.body.email.trim(), req.body.github.trim(), hashed_password]
            )
                .then(() => {
                    res.status(201).send()
                })
                .catch((err) => {
                    if (err.code === '23505') {
                        // unique violation
                        res.status(400).json(errorResponse('DUPLICATE_USER'))
                        return
                    }

                    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
                })
        })
        .catch(() => {
            res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
        })
})

router.post('/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
        res.status(400).json(errorResponse('MISSING_PARAMETERS'))
        return
    }

    pool.query('SELECT * FROM users u WHERE u.email = $1', [
        req.body.email.trim(),
    ])
        .then((dbres) => {
            if (dbres.rowCount === 0) {
                res.status(400).json(errorResponse('WRONG_EMAIL'))
                return
            }

            bcrypt
                .compare(req.body.password, dbres.rows[0].password)
                .then((correct) => {
                    if (!correct) {
                        res.status(400).json(errorResponse('WRONG_PASSWORD'))
                        return
                    }

                    const token = jwt.sign(
                        {
                            usr: dbres.rows[0].email,
                            ghb: dbres.rows[0].github_username,
                            adm: dbres.rows[0].admin,
                        },
                        // for now it's stored in an environment variable, for
                        // production use it can be stored as a secret in AWS
                        process.env.JWT_SECRET,
                        {
                            expiresIn: 60 * 60 * 24 * 90, // 90 days
                        }
                    )

                    return res.status(200).json({
                        auth_token: token,
                    })
                })
                .catch(() => {
                    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
                })
        })
        .catch(() => {
            res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
        })
})

module.exports = router
