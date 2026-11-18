import type { Relation } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import type { Knex } from 'knex';
import { mapValues } from 'lodash-es';
import {
	LINK_TABLE_PREFIX,
	SHADOW_TABLE_PREFIX,
	VERSION_REFERENCE_PREFIX,
} from '../../../services/version-tables/constants.js';
import type { VersionTables } from '../../../services/version-tables/plan-version-tables.js';
import type { SchemaHelper } from '../schema/types.js';
import { DatabaseHelper } from '../types.js';

/**
 * Vendor specific behavior of the shadow and link tables of versioned collections
 */
export class VersioningHelper extends DatabaseHelper {
	constructor(
		knex: Knex,
		protected schema: SchemaHelper,
	) {
		super(knex);
	}

	/**
	 * The maximum length of table and column names. Longer names are truncated or rejected by the database.
	 */
	getMaxIdentifierLength(): number {
		return Infinity;
	}

	getShadowTableName(collection: string): string {
		return this.prefixName(SHADOW_TABLE_PREFIX, collection);
	}

	getLinkTableName(collection: string): string {
		return this.prefixName(LINK_TABLE_PREFIX, collection);
	}

	/**
	 * Name of the column in a shadow table that references a version of the related collection
	 */
	getVersionReferenceField(field: string): string {
		return this.prefixName(VERSION_REFERENCE_PREFIX, field);
	}

	/**
	 * Names of the shadow and link table of each given collection
	 */
	getVersionTableNames(collections: string[]): string[] {
		return collections.flatMap((collection) => [
			this.getShadowTableName(collection),
			this.getLinkTableName(collection),
		]);
	}

	/**
	 * Whether Directus would create a number column of this database type as a different type, like `smallint` as
	 * `integer`, losing precision or differing from the source column on every version table sync
	 */
	isSizedNumberType(_dataType: string): boolean {
		return false;
	}

	/**
	 * Adjust `on_delete` of the version table foreign keys the same way as for regular relations, as not every vendor
	 * supports every action
	 */
	applyForeignKeyRules(tables: VersionTables): VersionTables {
		return mapValues(tables, (table) => ({
			...table,
			foreignKeys: table.foreignKeys.map((foreignKey) => {
				const schema = { on_delete: foreignKey.on_delete } as NonNullable<Relation['schema']>;

				this.schema.preRelationChange({
					collection: table.table,
					related_collection: foreignKey.foreign_key_table,
					schema,
				});

				return { ...foreignKey, on_delete: schema.on_delete };
			}),
		}));
	}

	/**
	 * Prefix a name, replacing the end of the name with a hash if the result would exceed the identifier length limit.
	 * Otherwise vendors would truncate the name, causing it to no longer match and possibly collide with other names.
	 */
	protected prefixName(prefix: string, name: string): string {
		const prefixed = `${prefix}${name}`;
		const maxLength = this.getMaxIdentifierLength();

		if (prefixed.length <= maxLength) return prefixed;

		const suffix = `__${getSimpleHash(prefixed)}`;

		return `${prefixed.substring(0, maxLength - suffix.length)}${suffix}`;
	}
}
