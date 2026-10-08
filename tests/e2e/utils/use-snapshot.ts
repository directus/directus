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
import { getUID } from './getUID.js';
import { renameCollections } from './rename-collections.js';

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
 * @param snapshot The snapshot to apply, usually built with the SchemaBuilder in the `snapshot.ts` next to the test.
 * @returns the names of the created collections and the snapshot that was applied.
 */
export async function useSnapshot<Schema>(
	api: DirectusClient<unknown> & RestClient<unknown>,
	snapshot: Snapshot,
): Promise<{ collections: Collections<Schema>; snapshot: Snapshot }> {
	const uid = getUID(1);
	const collectionMap: Record<string, string> = {};

	for (const { collection } of snapshot.collections) {
		collectionMap[collection] = `${uid}_${collection}`;
	}

	const renamed = renameCollections(snapshot, (collection) => collectionMap[collection]!);

	const schemaSnapshot = {
		...renamed,
		collections: renamed.collections.map((collection, index) => ({
			...collection,
			meta: collection.meta && {
				...collection.meta,
				group: uid,
				translations: [{ language: 'en-US', translation: startCase(snapshot.collections[index]!.collection) }],
			},
		})),
	} as SchemaSnapshotOutput;

	if (!groups.includes(uid)) {
		schemaSnapshot.collections.push(getGroup(uid));
		groups.push(uid);
	}

	let tries = 1;
	let lastError: any = null;

	while (tries > 0) {
		try {
			const diff = await api.request(schemaDiff(schemaSnapshot, { force: true }));

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
