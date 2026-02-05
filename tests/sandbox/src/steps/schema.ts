import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { Snapshot } from '@directus/types';
import chalk from 'chalk';
import { camelCase, upperFirst } from 'lodash-es';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import { getRelationInfo } from '../relation.js';
import { apiFolder } from '../sandbox.js';

export async function loadSchema(schema_file: string, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Applying Schema');

	const schema = spawn(
		'node',
		[join(apiFolder, 'dist', 'cli', 'run.js'), 'schema', 'apply', '-y', resolve(schema_file)],
		{
			env,
		},
	);

	schema.on('error', (err) => {
		schema.kill();
		throw err;
	});

	logger.pipe(schema.stdout, 'debug');
	logger.pipe(schema.stderr, 'error');

	await new Promise((resolve) => schema.on('close', resolve));
	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
	logger.info(`Schema Applied ${time}`);
}

export async function saveSchema(env: Env) {
	return setInterval(async () => {
		const data = await fetch(`${env.PUBLIC_URL}/schema/snapshot?access_token=${env.ADMIN_TOKEN}`);
		const snapshot = (await data.json()) as { data: Snapshot };

		const collections = snapshot.data.collections.filter((collection) => collection.schema);

		const schema = `export type Schema = {
	${collections
		.map((collection) => {
			const collectionName = formatCollection(collection.collection);

			if (collection.meta?.singleton) return `${formatField(collection.collection)}: ${collectionName}`;

			return `${formatField(collection.collection)}: ${collectionName}[];`;
		})
		.join('\n	')}
};
`;

		const collectionTypes = collections
			.map((collection) => {
				const collectionName = formatCollection(collection.collection);

				return `export type ${collectionName} = {
	${snapshot.data.fields
		.filter((field) => field.collection === collection.collection)
		.map((field) => {
			const rel = getRelationInfo(snapshot.data.relations, collection.collection, field.field);
			const optional = field.schema?.is_nullable || field.schema?.is_generated || field.schema?.is_primary_key;
			const fieldName = `${formatField(field.field)}${optional ? '?' : ''}:`;

			if (!rel) return `${fieldName} string | number;`;

			const { relation, relationType } = rel;

			if (relationType === 'o2m') {
				return `${fieldName} (string | number | ${formatCollection(relation.collection)})[];`;
			} else if (relationType === 'm2o') {
				return `${fieldName} string | number | ${formatCollection(relation.related_collection!)};`;
			} else {
				return `${fieldName} string | number | ${relation.meta!.one_allowed_collections!.map(formatCollection).join(' | ')};`;
			}
		})
		.join('\n	')}
};`;
			})
			.join('\n');

		await writeFile('schema.d.ts', schema + collectionTypes);
		await writeFile('snapshot.json', JSON.stringify(snapshot.data, null, 4));
	}, 2000);
}

function formatCollection(title: string) {
	return upperFirst(camelCase(title.replaceAll('_1234', '')));
}

function formatField(title: string) {
	return title.replaceAll('_1234', '');
}
