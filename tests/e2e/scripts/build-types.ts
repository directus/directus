import { glob, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SchemaBuilder } from '@directus/schema-builder';

/** Generates a schema.d.ts next to every snapshot.ts, based on the schema it exports */
for await (const file of glob('tests/**/snapshot.ts')) {
	const { schema } = (await import(pathToFileURL(file).href)) as { schema: SchemaBuilder };

	await writeFile(join(dirname(file), 'schema.d.ts'), schema.types());
}
