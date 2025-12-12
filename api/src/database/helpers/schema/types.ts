import type { KNEX_TYPES } from '@directus/constants';
import type { Column } from '@directus/schema';
import type { DatabaseClient, Field, RawField, Relation, Type } from '@directus/types';
import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../../utils/get-default-index-name.js';
import { getDatabaseClient } from '../../index.js';
import { DatabaseHelper } from '../types.js';

export type Options = { nullable?: boolean; default?: any; length?: number };

export type Sql = {
	sql: string;
	bindings: readonly Knex.Value[];
};

export type SortRecord = {
	alias: string;
	column: Knex.Raw;
};

export type CreateIndexOptions = {
	attemptConcurrentIndex?: boolean;
	unique?: boolean;
};

export abstract class SchemaHelper extends DatabaseHelper {
	isOneOfClients(clients: DatabaseClient[]): boolean {
		return clients.includes(getDatabaseClient(this.knex));
	}

	async changeNullable(table: string, column: string, nullable: boolean): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			if (nullable) {
				builder.setNullable(column);
			} else {
				builder.dropNullable(column);
			}
		});
	}

	generateIndexName(type: 'unique' | 'foreign' | 'index', collection: string, fields: string | string[]): string {
		return getDefaultIndexName(type, collection, fields);
	}

	async changeToType(
		table: string,
		column: string,
		type: (typeof KNEX_TYPES)[number],
		options: Options = {},
	): Promise<void> {
		await this.knex.schema.alterTable(table, (builder) => {
			const b = type === 'string' ? builder.string(column, options.length) : builder[type](column);

			if (options.nullable === true) {
				b.nullable();
			}

			if (options.nullable === false) {
				b.notNullable();
			}

			if (options.default !== undefined) {
				b.defaultTo(options.default);
			}

			b.alter();
		});
	}

	protected async changeToTypeByCopy(
		table: string,
		column: string,
		type: (typeof KNEX_TYPES)[number],
		options: Options,
	): Promise<void> {
		const tempName = `${column}__temp`;

		await this.knex.schema.alterTable(table, (builder) => {
			const col = type === 'string' ? builder.string(tempName, options.length) : builder[type](tempName);

			if (options.default !== undefined) {
				col.defaultTo(options.default);
			}

			// Force new temporary column to be nullable (required, as there will already be rows in
			// the table)
			col.nullable();
		});

		await this.knex(table).update(tempName, this.knex.ref(column));

		await this.knex.schema.alterTable(table, (builder) => {
			builder.dropColumn(column);
		});

		await this.knex.schema.alterTable(table, (builder) => {
			builder.renameColumn(tempName, column);
		});

		// We're altering the temporary column here. That starts nullable, so we only want to set it
		// to NOT NULL when applicable
		if (options.nullable === false) {
			await this.changeNullable(table, column, options.nullable);
		}
	}

	async preColumnChange(): Promise<boolean> {
		return false;
	}

	async postColumnChange(): Promise<void> {
		return;
	}

	preRelationChange(_relation: Partial<Relation>): void {
		return;
	}

	setNullable(column: Knex.ColumnBuilder, field: RawField | Field, existing: Column | null): void {
		const isNullable = field.schema?.is_nullable ?? existing?.is_nullable ?? true;

		if (isNullable) {
			column.nullable();
		} else {
			column.notNullable();
		}
	}

	processFieldType(field: Field): Type {
		return field.type;
	}

	constraintName(existingName: string): string {
		// most vendors allow for dropping/creating constraints with the same name
		// reference issue #14873
		return existingName;
	}

	applyLimit(rootQuery: Knex.QueryBuilder, limit: number): void {
		if (limit !== -1) {
			rootQuery.limit(limit);
		}
	}

	applyOffset(rootQuery: Knex.QueryBuilder, offset: number): void {
		rootQuery.offset(offset);
	}

	castA2oPrimaryKey(): string {
		return 'CAST(?? AS CHAR(255))';
	}

	formatUUID(uuid: string): string {
		return uuid; // no-op by default
	}

	/**
	 * @returns Size of the database in bytes
	 */
	async getDatabaseSize(): Promise<number | null> {
		return null;
	}

	prepQueryParams(queryParams: Sql): Sql {
		return queryParams;
	}

	prepBindings(bindings: Knex.Value[]): any {
		return bindings;
	}

	addInnerSortFieldsToGroupBy(
		_groupByFields: (string | Knex.Raw)[],
		_sortRecords: SortRecord[],
		_hasRelationalSort: boolean,
	): void {
		// no-op by default
	}

	getColumnNameMaxLength() {
		return 64;
	}

	getTableNameMaxLength() {
		return 64;
	}

	/**
	 * Creates an index on the specified field(s).
	 *
	 * @param collection - Table name
	 * @param field - Single field name or array of field names for composite index
	 * @param options - Index creation options
	 *
	 * @example
	 * // Single column index
	 * await helpers.schema.createIndex('users', 'email');
	 *
	 * // Composite index
	 * await helpers.schema.createIndex('revisions', ['collection', 'item', 'version']);
	 *
	 * @remarks
	 * **Composite Index Limits by Database:**
	 * | Database       | Max Columns | Notes                           |
	 * |----------------|-------------|---------------------------------|
	 * | MySQL/InnoDB   | 16          | Hard limit                      |
	 * | PostgreSQL     | 32          | Configurable via recompilation  |
	 * | Oracle         | 32          | Fixed                           |
	 * | SQL Server     | 32          | 16 for versions < 2016          |
	 * | CockroachDB    | No limit    | Avoid keys > 1MiB               |
	 * | SQLite         | 2000        | Configurable via recompilation  |
	 */
	async createIndex(
		collection: string,
		field: string | string[],
		options: CreateIndexOptions = {},
	): Promise<Knex.SchemaBuilder> {
		const fields = Array.isArray(field) ? field : [field];
		const isUnique = Boolean(options.unique);
		const constraintName = this.generateIndexName(isUnique ? 'unique' : 'index', collection, fields);
		const placeholders = fields.map(() => '??').join(', ');

		return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (${placeholders})`, [
			constraintName,
			collection,
			...fields,
		]);
	}
}
