const _error = require('./strings').error

exports.errorResponse = function (str) {
    return {
        error: str,
        message: _error[str],
    }
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
exports.HTTPCode = {
    OK: 200,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
}