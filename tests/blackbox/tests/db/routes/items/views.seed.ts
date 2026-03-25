import config from '@common/config';
import { CreateCollection, CreateField, CreateItem, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import knex from 'knex';
import { expect, it } from 'vitest';

export const collectionSource = 'test_items_views_source';
export const viewName = 'test_items_views_readonly';

export const seedDBStructure = (): void => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			try {
				const db = knex(config.knexConfig[vendor]!);

				// Clean up any previous runs (wrapped in catch for first-run scenarios)
				await db.raw(`DROP VIEW ??`, [viewName]).catch(() => {});
				await DeleteCollection(vendor, { collection: viewName }).catch(() => {});
				await DeleteCollection(vendor, { collection: collectionSource }).catch(() => {});

				// Create source table via Directus API
				await CreateCollection(vendor, {
					collection: collectionSource,
					primaryKeyType: 'integer',
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionSource,
					field: 'name',
					type: 'string',
					meta: {},
					schema: {},
				});

				await CreateField(vendor, {
					collection: collectionSource,
					field: 'value',
					type: 'integer',
					meta: {},
					schema: {},
				});

				// Insert seed data
				await CreateItem(vendor, {
					collection: collectionSource,
					item: { name: 'item_a', value: 10 },
				});

				await CreateItem(vendor, {
					collection: collectionSource,
					item: { name: 'item_b', value: 20 },
				});

				// Use ?? bindings so knex quotes identifiers correctly per dialect
				await db.raw(`CREATE VIEW ?? AS SELECT ??, ??, ?? FROM ??`, [
					viewName,
					'id',
					'name',
					'value',
					collectionSource,
				]);

				await db.destroy();

				expect(true).toBeTruthy();
			} catch (error) {
				expect(error).toBeFalsy();
			}
		},
		300_000,
	);
};
