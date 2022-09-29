const auth = require('../middleware/auth')
const errorResponse = require('../util').errorResponse
const { validate } = require('jsonschema')

const express = require('express')
const router = express.Router()

// database connection
const pool = require('../db')

// yaml
const YAML = require('yaml')

router.get('/', auth.requireAuthenticated, auth.requireAdmin, (req, res) => {
    pool.query('SELECT id, description, created, last_modified, severity, category, enabled FROM rules')
        .then((result) => {
            for (const row of result.rows) {
                row.yaml_file = YAML.stringify(row.yaml_file)
            }

            res.json(result.rows)
        })
        .catch(() => {
            res.status(500)
            res.json(errorResponse('INTERNAL_SERVER_ERROR'))
        })
})

router.get('/:id', auth.requireAuthenticated, auth.requireAdmin, (req, res) => {
    pool.query('SELECT * FROM rules WHERE id = $1', [req.params.id])
        .then((result) => {
            for (const row of result.rows) {
                row.yaml_file = YAML.stringify(row.yaml_file)
            }

            res.json(result.rows)
        })
        .catch(() => {
            res.status(500)
            res.json(errorResponse('INTERNAL_SERVER_ERROR'))
        })
})

router.delete('/:id', auth.requireAuthenticated, auth.requireAdmin, (req, res) => {
    pool.query('DELETE FROM rules WHERE id = $1', [req.params.id])
        .then(() => {
            res.status(200).send()
        })
        .catch(() => {
            res.status(500)
            res.json(errorResponse('INTERNAL_SERVER_ERROR'))
        })
})

router.post('/', auth.requireAuthenticated, auth.requireAdmin, (req, res) => {
    // check for necessary parameters
    if (!req.body.description || !req.body.yaml_file) {
        res.status(400).json(errorResponse('MISSING_PARAMETERS'))
        return
    }

    try {
        const yaml_file = YAML.parse(req.body.yaml_file)
        const schema = require('../schema/rule.json')

        const validation = validate(yaml_file, schema)
        if (!validation.valid) {
            res.status(400).json(errorResponse('INVALID_RULE', validation.errors))
            return
        }

        // already validated by the schema
        const severityEnum = {
            LOW: 0,
            MEDIUM: 1,
            HIGH: 2,
            CRITICAL: 3,
        }

        pool.query(
            'INSERT INTO rules (description, yaml_file, severity, category) VALUES ($1, $2, $3, $4) RETURNING id',
            [req.body.description.trim(), JSON.stringify(yaml_file), severityEnum[yaml_file.severity], yaml_file.category]
        )
            .then((dbres) => {
                res.status(201).json({ id: dbres.rows[0].id })
            })
            .catch(() => {
                res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
            })
    } catch (e) {
        res.status(400).json(errorResponse('INVALID_YAML'))
    }
})

router.put(
    '/enable/:id',
    auth.requireAuthenticated,
    auth.requireAdmin,
    (req, res) => {
        pool.query('UPDATE rules SET enabled = true, last_modified = NOW() WHERE id = $1', [
            req.params.id,
        ])
            .then((dbres) => {
                res.status(200).send()
            })
            .catch((e) => {
                res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
            })
    }
)

router.put(
    '/disable/:id',
    auth.requireAuthenticated,
    auth.requireAdmin,
    (req, res) => {
        pool.query('UPDATE rules SET enabled = false, last_modified = NOW() WHERE id = $1', [
            req.params.id,
        ])
            .then((dbres) => {
                res.status(200).send()
            })
            .catch(() => {
                res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
            })
    }
)

module.exports = router
