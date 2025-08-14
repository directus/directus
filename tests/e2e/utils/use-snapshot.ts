import { DirectusClient, RestClient, schemaApply, schemaDiff, SchemaSnapshotOutput } from '@directus/sdk';
import { readFile } from 'fs/promises';
import { dirname } from 'path';
import { deepMap } from '@directus/utils';
import { Snapshot } from '@directus/types';
import { startCase } from 'lodash-es';

export type Collections<Schema> = { [P in keyof Schema]: P };

export async function useSnapshot<Schema>(
	api: DirectusClient<any> & RestClient<any>,
	file: string,
): Promise<Collections<Schema>> {
	const snapshot: Snapshot = JSON.parse(await readFile(file, { encoding: 'utf8' }));
	const collectionIDs = snapshot.collections.map((collection) => collection.collection);
	const collectionMap: Record<string, string> = {};
	const nameMap: Record<string, string> = {};
	const collectionReplace: Record<string, string> = {};

	const parts = dirname(file).split('/');
	const e2eIndex = parts.findIndex((part) => part === 'e2e');
	const prefix = parts.slice(e2eIndex + 2).join('_');

	for (const cid of collectionIDs) {
		const name = cid.replaceAll('_1234', '');
		collectionMap[name] = prefix + '_' + name;
		collectionReplace[cid] = collectionMap[name];
		nameMap[prefix + '_' + name] = name;
	}

	const schemaSnapshot = deepMap(snapshot, (value) => {
		if (typeof value === 'string' && value in collectionReplace) return collectionReplace[value];
		return value;
	}) as SchemaSnapshotOutput;

	schemaSnapshot.collections = schemaSnapshot.collections.map((collection) => {
		collection.meta.group = prefix;
		collection.meta.translations = [{ language: 'en-US', translation: startCase(nameMap[collection.collection]) }];
		return collection;
	});

	schemaSnapshot.collections.push(getGroup(prefix));

	const diff = await api.request(schemaDiff(schemaSnapshot, true));

	if (diff) {
		diff.diff['collections'] = diff.diff['collections'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
		diff.diff['fields'] = diff.diff['fields'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
		diff.diff['relations'] = diff.diff['relations'].filter((collection) => collection?.diff[0]?.['kind'] === 'N');
	}

	if (diff) await api.request(schemaApply(diff));

	return collectionMap as any;
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
