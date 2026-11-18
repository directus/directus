import type { Knex } from 'knex';
import { describe, expect, test, vi } from 'vitest';
import type { VersionTables } from '../../../services/version-tables/plan-version-tables.js';
import { isVersioningTable } from '../../../services/version-tables/utils.js';
import type { SchemaHelper } from '../schema/types.js';
import { VersioningHelperMSSQL } from './dialects/mssql.js';
import { VersioningHelper } from './types.js';

const knex = {} as Knex;

function schemaHelper(maxIdentifierLength = Infinity) {
	return { preRelationChange: vi.fn(), getMaxIdentifierLength: () => maxIdentifierLength } as unknown as SchemaHelper;
}

const schema = schemaHelper();

describe('version table names', () => {
	const maxLength = 63;
	const helper = new VersioningHelper(knex, schemaHelper(maxLength));

	test('prefixes short names', () => {
		expect(helper.getShadowTableName('articles')).toBe('directus_shadow_articles');
		expect(helper.getLinkTableName('articles')).toBe('directus_link_articles');
		expect(helper.getVersionReferenceField('author')).toBe('version_ref_author');
		expect(helper.getVersionTableNames(['articles'])).toEqual(['directus_shadow_articles', 'directus_link_articles']);
	});

	test('shortens names exceeding the identifier length limit with a hash, keeping them unique', () => {
		const a = helper.getLinkTableName('endpoints_query_version_item_articles_tags_junction');
		const b = helper.getLinkTableName('endpoints_query_version_item_articles_tags_junction_2');

		expect(a.length).toBeLessThanOrEqual(maxLength);
		expect(b.length).toBeLessThanOrEqual(maxLength);
		expect(a).not.toBe(b);
		expect(isVersioningTable(a)).toBe(true);
		expect(helper.getLinkTableName('endpoints_query_version_item_articles_tags_junction')).toBe(a);

		expect(helper.getVersionReferenceField('f'.repeat(64)).length).toBeLessThanOrEqual(maxLength);
	});

	test('keeps long names as is when the database has no identifier length limit', () => {
		const collection = 'endpoints_query_version_item_articles_tags_junction';

		expect(new VersioningHelper(knex, schema).getLinkTableName(collection)).toBe(`directus_link_${collection}`);
	});
});

describe('applyForeignKeyRules', () => {
	const tables: VersionTables = {
		directus_shadow_articles: {
			table: 'directus_shadow_articles',
			type: 'shadow',
			columns: [],
			foreignKeys: [
				{
					column: 'version_user_created',
					foreign_key_table: 'directus_users',
					foreign_key_column: 'id',
					on_delete: 'SET NULL',
					on_update: null,
				},
				{
					column: 'version_user_updated',
					foreign_key_table: 'directus_users',
					foreign_key_column: 'id',
					on_delete: 'SET NULL',
					on_update: null,
				},
			],
		},
	};

	test('applies the relation rules of the schema helper', () => {
		const preRelationChange = vi.fn((relation) => {
			relation.schema.on_delete = 'NO ACTION';
		});

		const helper = new VersioningHelper(knex, { preRelationChange } as unknown as SchemaHelper);
		const result = helper.applyForeignKeyRules(tables);

		expect(preRelationChange).toHaveBeenCalledTimes(2);

		expect(result['directus_shadow_articles']!.foreignKeys.map((foreignKey) => foreignKey.on_delete)).toEqual([
			'NO ACTION',
			'NO ACTION',
		]);
	});

	test('removes the actions of foreign keys causing multiple cascade paths on MSSQL', () => {
		const result = new VersioningHelperMSSQL(knex, schema).applyForeignKeyRules(tables);

		expect(result['directus_shadow_articles']!.foreignKeys.map((foreignKey) => foreignKey.on_delete)).toEqual([
			null,
			null,
		]);
	});
});
