import {readFileSync, existsSync} from 'fs'

const FILE_PATH = './dist/openapi.json'

if(!existsSync(FILE_PATH)) {
    throw new Error('OpenAPI file not found, build @directus/specs first')
}

const openapi = JSON.parse(readFileSync(FILE_PATH, 'utf8'))

export {openapi}