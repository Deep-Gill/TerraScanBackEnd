const _error = require('./strings').error

exports.errorResponse = function (str, additional) {
    return {
        error: str,
        message: _error[str],
        information: additional,
    }
}
