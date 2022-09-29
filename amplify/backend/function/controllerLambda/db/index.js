// Database connection
// needs the following env vars: PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT
// for now it's stored in an environment variable, for
// production use it can be stored as a secret in AWS
const { Pool } = require('pg')
module.exports = new Pool()
