import { writeFile } from 'node:fs/promises';

const { ThemeSchema, Definitions } = await import('./dist/index.js');

const jsonSchema = JSON.stringify(
	{
		...ThemeSchema,
		...Definitions,
	},
	null,
	'\t'
);

await writeFile('./dist/schema.json', jsonSchema);
