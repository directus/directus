import { writeFile } from 'node:fs/promises';
import { ThemeSchema } from './dist/index.js';

const jsonSchema = JSON.stringify(ThemeSchema, null, '\t');

await writeFile('./schema.json', jsonSchema);
