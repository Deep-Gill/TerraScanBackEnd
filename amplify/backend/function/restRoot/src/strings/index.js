// yaml file parser
const fs = require('fs')
const YAML = require('yaml')
const path = require('path')

// reason for path.resolve https://stackoverflow.com/questions/44600943/fs-readfilesync-is-not-file-relative-node-js
exports.error = YAML.parse(
    fs.readFileSync(path.resolve(__dirname, './error-messages.yaml'), 'utf8')
)