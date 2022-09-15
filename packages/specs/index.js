import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.join(__dirname, './dist/openapi.json');

const openapi = JSON.parse(readFileSync(FILE_PATH, 'utf8'));

export { openapi };
