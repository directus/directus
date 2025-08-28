import {
	createItem,
	DirectusClient,
	readCollection,
	readItems,
	RestClient,
	schemaApply,
	schemaDiff,
	SchemaSnapshotOutput,
} from '@directus/sdk';
import { readFile } from 'fs/promises';
import { dirname } from 'path';
import { deepMap } from './deepMap';
import { Snapshot } from '@directus/types';
import { startCase } from 'lodash-es';
import { Database } from '@directus/sandbox';

export type Collections<Schema> = { [P in keyof Schema]: P };

const groups: string[] = [];

export async function useSnapshot<Schema>(
	api: DirectusClient<any> & RestClient<any>,
	file: string,
): Promise<{ collections: Collections<Schema>; snapshot: Snapshot }> {
	const collectionMap: Record<string, string> = {};
	const collectionNameMap: Record<string, string> = {};
	const collectionReplace: Record<string, string> = {};

	const fieldReplace: Record<string, string> = {};

	const database = process.env['DATABASE'] as Database;

	const parts = dirname(file).split(/[/\\]/g);
	const e2eIndex = parts.findIndex((part) => part === 'e2e');
	const prefix = parts.slice(e2eIndex + 2).join('_');

	await api.request(
		createItem('schema_apply_order', {
			group: prefix,
		}),
	);

	const orders = await api.request(readItems('schema_apply_order'));

	const orderIndex = orders.findIndex((raw) => raw['group'] === prefix);

	if (orderIndex !== 0) {
		let inFrontExists = false;

		do {
			try {
				await api.request(readCollection(orders[Number(orderIndex) - 1]['group']));
			} catch {
				await new Promise((r) => setTimeout(r, 1000));
			} finally {
				inFrontExists = true;
			}
		} while (!inFrontExists);
	}

	const snapshot: Snapshot = JSON.parse(await readFile(file, { encoding: 'utf8' }));
	const collectionIDs = snapshot.collections.map((collection) => collection.collection);
	const fieldIDs = snapshot.fields.map((field) => field.field);

	for (const cid of collectionIDs) {
		const name = cid.replaceAll('_1234', '');
		collectionMap[name] = prefix + '_' + name;
		collectionReplace[cid] = collectionMap[name];
		collectionNameMap[prefix + '_' + name] = name;
	}

	for (const fid of fieldIDs) {
		if (!fid.includes('_1234')) continue;
		const name = fid.replaceAll('_1234', '');
		fieldReplace[fid] = name;
	}

	const schemaSnapshot = deepMap(snapshot, (key, value) => {
		if (typeof key === 'string' && key in fieldReplace) key = fieldReplace[key];
		if (typeof value === 'string' && value in fieldReplace) value = fieldReplace[value];

		if (typeof key === 'string' && key in collectionReplace) key = collectionReplace[key];
		if (typeof value === 'string' && value in collectionReplace) value = collectionReplace[value];
		return [key, value];
	}) as SchemaSnapshotOutput;

	schemaSnapshot.collections = schemaSnapshot.collections.map((collection) => {
		collection.meta.group = prefix;

		collection.meta.translations = [
			{ language: 'en-US', translation: startCase(collectionNameMap[collection.collection]) },
		];

		return collection;
	});

	if (!groups.includes(prefix)) {
		schemaSnapshot.collections.push(getGroup(prefix));
		groups.push(prefix);
	}

	let tries = 3;

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

				await api.request(schemaApply(diff));
				break;
			}
		} catch (e) {
			tries--;
			if (tries === 0) process.stderr.write(e.toString());
		}
	}

	if (tries === 0) {
		throw new Error('Too many retries applying snapshot');
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
