import type { Relation } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import type { Knex } from 'knex';
import {
	LINK_TABLE_PREFIX,
	SHADOW_TABLE_PREFIX,
	VERSION_REFERENCE_PREFIX,
	VERSIONED_READ_PREFIX,
} from '../../../services/version-tables/constants.js';
import type { VersionTableForeignKey } from '../../../services/version-tables/plan-version-tables.js';
import type { SchemaHelper } from '../schema/types.js';
import { DatabaseHelper } from '../types.js';

/**
 * Knex names primary key constraints `<table>_pkey`. On Postgres, a full length table name would truncate it to the
 * table name itself, which fails as the constraint's index is a relation of the same name.
 */
const PRIMARY_KEY_SUFFIX = '_pkey';

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

	getShadowTableName(collection: string): string {
		return this.prefixName(SHADOW_TABLE_PREFIX, collection, PRIMARY_KEY_SUFFIX.length);
	}

	getLinkTableName(collection: string): string {
		return this.prefixName(LINK_TABLE_PREFIX, collection, PRIMARY_KEY_SUFFIX.length);
	}

	/**
	 * Name of the collection that reads the live items of a collection together with its versions
	 */
	getVersionedReadName(collection: string): string {
		return this.prefixName(VERSIONED_READ_PREFIX, collection);
	}

	/**
	 * Name of the column in a shadow table that references a version of the related collection
	 */
	getVersionReferenceField(field: string): string {
		return this.prefixName(VERSION_REFERENCE_PREFIX, field);
	}

	/**
	 * Name of the column of a versioned read collection that holds the references of an a2o field to versions of one of
	 * its related collections, which lets filters follow them like m2o relations
	 */
	getA2OVersionReferenceField(field: string, collection: string): string {
		return this.prefixName(VERSION_REFERENCE_PREFIX, `${field}__${collection}`);
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
	 * Adjust `on_delete` of the version table foreign keys the same way as for regular relations, as not every vendor
	 * supports every action
	 */
	adjustForeignKeyActions(table: string, foreignKeys: VersionTableForeignKey[]): VersionTableForeignKey[] {
		return foreignKeys.map((foreignKey) => {
			const schema = { on_delete: foreignKey.on_delete } as NonNullable<Relation['schema']>;

			this.schema.preRelationChange({
				collection: table,
				related_collection: foreignKey.foreign_key_table,
				schema,
			});

			return { ...foreignKey, on_delete: schema.on_delete };
		});
	}

	/**
	 * Prefix a name, replacing the end of the name with a hash if the result would exceed the identifier length limit.
	 * Otherwise vendors would truncate the name, causing it to no longer match and possibly collide with other names.
	 *
	 * @param reserve - Characters to keep free for suffixes derived from the name
	 */
	protected prefixName(prefix: string, name: string, reserve = 0): string {
		const prefixed = `${prefix}${name}`;
		const maxLength = this.schema.getMaxIdentifierLength() - reserve;

		if (prefixed.length <= maxLength) return prefixed;

		const suffix = `__${getSimpleHash(prefixed)}`;

		return `${prefixed.substring(0, maxLength - suffix.length)}${suffix}`;
	}
}
