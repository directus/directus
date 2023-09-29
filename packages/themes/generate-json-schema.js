import { writeFile } from 'node:fs/promises';

const { ThemeSchema } = await import('./dist/index.js');
const jsonSchema = JSON.stringify(ThemeSchema, null, '\t');
await writeFile('./dist/schema.json', jsonSchema);
