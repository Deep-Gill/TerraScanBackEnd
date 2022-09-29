const auth = require('../middleware/auth')
const errorResponse = require('../util').errorResponse

const express = require('express')
const router = express.Router()

// database connection
const pool = require('../db')

router.get('/', auth.requireAuthenticated, (req, res) => {
    const queryString =
        'SELECT v.*, r.severity FROM violations v, rules r WHERE v.rule_id = r.id AND repo_name LIKE $1 AND github_username LIKE $2 AND pull_url LIKE $3'
    const parameters = ['%%', '%%', '%%']

    if (req?.jwt?.adm) {
        // user is admin
        if (req.query.repo) {
            parameters[0] = `%${req.query.repo.trim()}%`
        }

        if (req.query.user) {
            parameters[1] = `%${req.query.user.trim()}%`
        }

        if (req.query.pull_request) {
            parameters[2] = `%${req.query.pull_request.trim()}%`
        }
    } else if (req?.jwt?.ghb) {
        // user is not admin
        parameters[1] = `%${req.jwt.ghb.trim()}%`
    } else {
        res.status(400).json(errorResponse('JWT_ERROR'))
        return
    }

    pool.query(queryString, parameters)
        .then((dbres) => {
            res.status(200).json(dbres.rows)
        })
        .catch((err) => {
            res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
        })
})

router.get(
    '/aggregated',
    auth.requireAuthenticated,
    auth.requireAdmin,
    (req, res) => {
        // check for necessary parameters
        if (!req.query.type) {
            res.status(400).json(errorResponse('MISSING_PARAMETERS'))
            return
        }

        if (req.query.type === 'top10') {
            // return the top 10 violated rules
            pool.query(
                'SELECT v.rule_id, r.description, count(*) FROM violations v, rules r WHERE r.id = v.rule_id GROUP BY v.rule_id, r.description ORDER BY count(*) DESC LIMIT 10;'
            )
                .then((dbres) => {
                    res.status(200).json(dbres.rows)
                })
                .catch((err) => {
                    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
                })
        } else if (req.query.type == 'count-per-repo') {
            // return violation count per repo
            pool.query(
                'SELECT repo_name, count(*) FROM violations GROUP BY repo_name ORDER BY count(*) DESC'
            )
                .then((dbres) => {
                    res.status(200).json(dbres.rows)
                })
                .catch((err) => {
                    res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR'))
                })
        } else {
            res.status(400).json(errorResponse('INVALID_PARAMETERS'))
        }
    }
)

module.exports = router
