// json web tokens
const jwt = require('jsonwebtoken')

function getBearerToken(req) {
    const authorizationHeader = req.get('Authorization')
    if (!authorizationHeader) {
        throw new Error('No authorization header.')
    }

    const bearer = authorizationHeader.split(' ')
    if (
        !bearer[0] ||
        !bearer[1] ||
        bearer[0].trim().toLowerCase() !== 'bearer'
    ) {
        throw new Error('Not a bearer token.')
    }

    return bearer[1].trim()
}

// authentication middleware
exports.requireAuthenticated = function (req, res, next) {
    try {
        // verify that the token is valid
        const token = jwt.verify(getBearerToken(req), process.env.JWT_SECRET)

        // verify the user exists
        if (token.usr) {
            req.jwt = token
            next()
        } else {
            // 401 Unauthorized
            res.status(401).send()
        }
    } catch (e) {
        // 401 Unauthorized
        res.status(401).send()
    }
}

exports.requireAdmin = function (req, res, next) {
    try {
        // verify the token is valid
        const token = jwt.verify(getBearerToken(req), process.env.JWT_SECRET)

        // verify the user is an admin
        if (token.adm) {
            next()
        } else {
            // 403 Forbidden
            res.status(403).send()
        }
    } catch (e) {
        // 401 Unauthorized
        res.status(401).send()
    }
}
