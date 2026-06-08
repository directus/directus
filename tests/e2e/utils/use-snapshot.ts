import { readFile } from 'fs/promises';
import { join } from 'path';
import {
	type DirectusClient,
	type RestClient,
	schemaApply,
	schemaDiff,
	type SchemaSnapshotOutput,
} from '@directus/sdk';
import type { Snapshot } from '@directus/types';
import { startCase } from 'lodash-es';
import { database } from './constants.js';
import { deepMap } from './deep-map.js';
import { getCallerFolder, getUID } from './getUID.js';

export type Collections<Schema> = { [P in keyof Schema]: P };

class RetryError extends Error {
	constructor(error: any) {
		super(`Too many retries applying snapshot: ${error.message}`);
		this.name = 'RetryError';
		this.stack = error.stack;
	}
}

const groups: string[] = [];

/**
 * Applies a snapshot to the api while also ensuring unique names of collections.
 * @param file The file to import. @default 'snapshot.json'.
 * @returns the names of the created collections and the parsed snapshot file that was used.
 */
export async function useSnapshot<Schema>(
	api: DirectusClient<unknown> & RestClient<unknown>,
	file = 'snapshot.json',
): Promise<{ collections: Collections<Schema>; snapshot: Snapshot }> {
	const collectionMap: Record<string, string> = {};
	const collectionNameMap: Record<string, string> = {};
	const collectionReplace: Record<string, string> = {};

	const fieldReplace: Record<string, string> = {};

	const folder = getCallerFolder(1);
	const uid = getUID(1);

	const snapshot: Snapshot = JSON.parse(await readFile(join(folder, file), { encoding: 'utf8' }));
	const collectionIDs = snapshot.collections.map((collection) => collection.collection);
	const fieldIDs = snapshot.fields.map((field) => field.field);

	for (const cid of collectionIDs) {
		const name = cid.replaceAll('_1234', '');
		collectionMap[name] = uid + '_' + name;
		collectionReplace[cid] = collectionMap[name];
		collectionNameMap[uid + '_' + name] = name;
	}

	for (const fid of fieldIDs) {
		if (!fid.includes('_1234')) continue;
		const name = fid.replaceAll('_1234', '');
		fieldReplace[fid] = name;
	}

	const schemaSnapshot = deepMap(snapshot, (key, value) => {
		if (typeof key === 'string' && key in fieldReplace) key = fieldReplace[key]!;
		if (typeof value === 'string' && value in fieldReplace) value = fieldReplace[value];

		if (typeof key === 'string' && key in collectionReplace) key = collectionReplace[key]!;
		if (typeof value === 'string' && value in collectionReplace) value = collectionReplace[value];
		return [key, value];
	}) as SchemaSnapshotOutput;

	schemaSnapshot.collections = schemaSnapshot.collections.map((collection) => {
		collection.meta.group = uid;

		collection.meta.translations = [
			{ language: 'en-US', translation: startCase(collectionNameMap[collection.collection]) },
		];

		return collection;
	});

	if (!groups.includes(uid)) {
		schemaSnapshot.collections.push(getGroup(uid));
		groups.push(uid);
	}

	let tries = 1;
	let lastError: any = null;

	while (tries > 0) {
		try {
			const diff = await api.request(schemaDiff(schemaSnapshot, true));

			if (diff) {
				diff.diff['collections'] = diff.diff['collections'].filter(
					(collection) => collection?.diff[0]?.['kind'] === 'N',
				);

				diff.diff['fields'] = diff.diff['fields'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
				diff.diff['relations'] = diff.diff['relations'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');

				// Fix as Oracle doesn't support on update
				if (database === 'oracle') {
					diff.diff['relations'] = diff.diff['relations']?.map((relation) => {
						return deepMap(relation, (key, value) => {
							if (key === 'on_update') {
								return [key, undefined];
							}

							return [key, value];
						});
					});
				}

				diff.diff['systemFields'] = [];

				await api.request(schemaApply(diff, true));

				break;
			}
		} catch (e: any) {
			tries--;
			lastError = e;
		}
	}

	if (tries === 0) {
		throw new RetryError(lastError);
	}

	return { collections: collectionMap as any, snapshot: schemaSnapshot as Snapshot };
}

function getGroup(name: string) {
	return {
		collection: name,
		meta: {
			system: false,
			accountability: 'all',
			archive_app_filter: true,
			archive_field: null,
			archive_value: null,
			collapse: 'open',
			collection: name,
			color: null,
			display_template: null,
			group: null,
			hidden: false,
			icon: 'folder',
			item_duplication_fields: null,
			note: null,
			preview_url: null,
			singleton: false,
			sort: 1,
			sort_field: null,
			translations: null,
			unarchive_value: null,
			versioning: false,
		},
	} as const;
}
