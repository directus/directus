import type { Column, ForeignKey, SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import { systemRelationRows } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	Relation,
	RelationMeta,
	SchemaOverview,
	Type,
} from '@directus/types';
import type { Knex } from 'knex';
import { groupBy } from 'lodash-es';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import { getDefaultIndexName } from '../utils/get-default-index-name.js';
import getLocalType from '../utils/get-local-type.js';
import { stitchRelations } from '../utils/stitch-relations.js';
import { FieldsService } from './fields.js';
import {
	getLinkTableName,
	getShadowTableName,
	isVersionTable,
	VERSION_META_FIELDS,
} from './version-tables/constants.js';
import {
	type LiveCollection,
	type OnDelete,
	planVersionTables,
	type VersionTable,
	type VersionTableColumn,
	type VersionTableForeignKey,
} from './version-tables/plan-version-tables.js';

type ColumnChanges = { add: VersionTableColumn[]; alter: VersionTableColumn[]; drop: string[] };

type ColumnsByTable = Record<string, Record<string, Column>>;

/**
 * Version tables as they currently exist in the database
 */
type ExistingVersionTables = {
	tables: string[];
	columns: ColumnsByTable;
	foreignKeys: ForeignKey[];
};

/**
 * Collections to sync the version tables of, `'all'` inspects the whole database
 */
export type CollectionScope = string[] | 'all';

export type SyncCollectionsOptions = {
	includeRelating?: boolean;
	exclude?: string[];
};

/**
 * Manages the shadow and link tables that back versioned collections.
 *
 * Schema changes made through the collections, fields and relations services sync only the version tables of the
 * collections they affect. Syncing is meant to be run within the same transaction as the change to the live schema,
 * after it was made.
 */
export class VersionTablesService {
	knex: Knex;
	helpers: Helpers;
	schemaInspector: SchemaInspector;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.helpers = getHelpers(this.knex);
		this.schemaInspector = options.knex ? createInspector(options.knex) : getSchemaInspector();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	/**
	 * Create, alter and drop the version tables of the given collections so they match the current schema and
	 * versioning settings. Passing `'all'` syncs the version tables of all collections, which inspects the whole database
	 * and is only meant to be run from migrations.
	 *
	 * @param collections - Collections whose version tables to sync, or `'all'` for all collections
	 * @param options.includeRelating - Also sync the collections with a m2o / a2o relation to the given collections.
	 * Needed when versioning of a collection is toggled or the collection is removed, as the version tables of those
	 * collections reference it.
	 * @param options.exclude - Collections to treat as if they no longer exist, used to clean up version tables before
	 * a live table is dropped
	 */
	async syncCollections(collections: CollectionScope, options?: SyncCollectionsOptions): Promise<void> {
		const exclude = new Set(options?.exclude ?? []);

		if (collections !== 'all' && options?.includeRelating) {
			const relating = await Promise.all(collections.map((collection) => this.getRelatingCollections(collection)));
			collections = [...collections, ...relating.flat()];
		}

		const versioned = new Set<string>(
			(await this.knex.select('collection').from('directus_collections').where('versioning', true))
				.map(({ collection }) => collection)
				.filter((collection) => !exclude.has(collection)),
		);

		const scope: CollectionScope =
			collections === 'all' ? 'all' : [...new Set(collections)].filter((collection) => !isVersionTable(collection));

		const existing = await this.readVersionTables(scope);

		// Prevents reading the live schema on every schema change for projects that don't use versioning
		if (versioned.size === 0 && existing.tables.length === 0) return;

		const liveCollections = await this.readLiveCollections(scope, exclude);
		const desiredTables = this.applyVendorForeignKeyRules(planVersionTables(liveCollections, versioned));

		await this.applyChanges(desiredTables, existing);
	}

	/**
	 * Read the version tables of the given collections, or all version tables for `'all'`
	 */
	private async readVersionTables(collections: CollectionScope): Promise<ExistingVersionTables> {
		if (collections === 'all') {
			const tables = (await this.schemaInspector.tables()).filter(isVersionTable);

			if (tables.length === 0) return { tables, columns: {}, foreignKeys: [] };

			return {
				tables,
				columns: groupColumns(
					(await this.schemaInspector.columnInfo()).filter((column) => isVersionTable(column.table)),
				),
				foreignKeys: (await this.schemaInspector.foreignKeys()).filter((foreignKey) =>
					isVersionTable(foreignKey.table),
				),
			};
		}

		const existing: ExistingVersionTables = { tables: [], columns: {}, foreignKeys: [] };

		for (const table of collections.flatMap((collection) => [
			getShadowTableName(collection),
			getLinkTableName(collection),
		])) {
			// Tables that don't exist have no columns
			const columns = await this.schemaInspector.columnInfo(table);

			if (columns.length === 0) continue;

			existing.tables.push(table);
			Object.assign(existing.columns, groupColumns(columns));
			existing.foreignKeys.push(...(await this.schemaInspector.foreignKeys(table)));
		}

		return existing;
	}

	/**
	 * Read the columns and m2o / a2o relations of the given live collections, or all live collections for `'all'`
	 */
	private async readLiveCollections(collections: CollectionScope, exclude: Set<string>): Promise<LiveCollection[]> {
		let columns: Column[];
		let foreignKeys: ForeignKey[];

		if (collections === 'all') {
			columns = (await this.schemaInspector.columnInfo()).filter((column) => !isVersionTable(column.table));

			foreignKeys = (await this.schemaInspector.foreignKeys()).filter(
				(foreignKey) => !isVersionTable(foreignKey.table),
			);
		} else {
			columns = [];
			foreignKeys = [];

			for (const collection of collections) {
				if (exclude.has(collection)) continue;

				columns.push(...(await this.schemaInspector.columnInfo(collection)));
				foreignKeys.push(...(await this.schemaInspector.foreignKeys(collection)));
			}
		}

		const relations = stitchRelations(await this.readRelationsMeta(collections), foreignKeys).filter(
			// Relations to removed collections are treated as if they don't exist
			(relation) => !relation.related_collection || !exclude.has(relation.related_collection),
		);

		const columnsByTable = groupBy(columns, 'table');
		const relationsByCollection = groupBy(relations, 'collection');

		return Object.entries(columnsByTable)
			.filter(([collection]) => !exclude.has(collection))
			.map(([collection, columns]) => ({
				collection,
				columns,
				relations: relationsByCollection[collection] ?? [],
			}));
	}

	/**
	 * Read the relation meta rows of the given "many" collections, or all of them for `'all'`
	 */
	private async readRelationsMeta(collections: CollectionScope): Promise<RelationMeta[]> {
		const query = this.knex.select('*').from('directus_relations');

		if (collections !== 'all') query.whereIn('many_collection', collections);

		const rows = (await query).map(
			(row: Record<string, any>): RelationMeta => ({
				...(row as RelationMeta),
				one_allowed_collections: parseList(row['one_allowed_collections']),
			}),
		);

		const systemRows = systemRelationRows.filter(
			(row) => collections === 'all' || collections.includes(row.many_collection),
		) as RelationMeta[];

		return [...rows, ...systemRows];
	}

	/**
	 * Collections that have a m2o / a2o relation to the given collection
	 */
	private async getRelatingCollections(collection: string): Promise<string[]> {
		const metaRows = await this.knex
			.select('many_collection', 'one_collection', 'one_allowed_collections')
			.from('directus_relations')
			.where('one_collection', collection)
			.orWhereNotNull('one_allowed_collections');

		const fromMeta = metaRows
			.filter(
				(row) =>
					row.one_collection === collection || parseList(row.one_allowed_collections)?.includes(collection) === true,
			)
			.map((row) => row.many_collection as string);

		// Relations without a meta row are only known from the foreign keys, which can't have changed since the schema
		// was read as they aren't managed by Directus
		const fromSchema = this.schema.relations
			.filter(
				(relation) =>
					relation.related_collection === collection ||
					relation.meta?.one_allowed_collections?.includes(collection) === true,
			)
			.map((relation) => relation.collection);

		return [...new Set([...fromMeta, ...fromSchema])].filter((relating) => !isVersionTable(relating));
	}

	/**
	 * Diff the planned version tables against the existing ones and apply the difference
	 */
	private async applyChanges(desiredTables: VersionTable[], existing: ExistingVersionTables): Promise<void> {
		const desiredByName = new Map(desiredTables.map((table) => [table.table, table]));

		const tablesToDrop = existing.tables.filter((table) => !desiredByName.has(table));
		const tablesToCreate = desiredTables.filter((table) => !existing.tables.includes(table.table));
		const columnChanges = getColumnChanges(desiredTables, existing.columns);

		// Foreign keys are dropped first, so tables and columns can be dropped / altered regardless of their order
		const foreignKeysToDrop = existing.foreignKeys.filter((foreignKey) => {
			const desired = desiredByName.get(foreignKey.table);
			const changes = columnChanges.get(foreignKey.table);

			if (!desired) return true;
			if (changes?.drop.includes(foreignKey.column)) return true;
			if (changes?.alter.some((column) => column.name === foreignKey.column)) return true;

			return !desired.foreignKeys.some((desiredForeignKey) => isSameForeignKey(foreignKey, desiredForeignKey));
		});

		await this.dropForeignKeys(foreignKeysToDrop);

		for (const table of tablesToDrop) {
			await this.knex.schema.dropTable(table);
		}

		if (tablesToCreate.length > 0 || columnChanges.size > 0) {
			const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

			for (const table of tablesToCreate) {
				await this.knex.schema.createTable(table.table, (builder) => {
					for (const column of table.columns) {
						this.addColumn(fieldsService, builder, table.table, column);
					}
				});
			}

			for (const [table, changes] of columnChanges) {
				await this.knex.schema.alterTable(table, (builder) => {
					if (changes.drop.length > 0) builder.dropColumns(...changes.drop);

					for (const column of changes.add) {
						this.addColumn(fieldsService, builder, table, column);
					}

					for (const column of changes.alter) {
						this.addColumn(fieldsService, builder, table, column, existing.columns[table]![column.name]);
					}
				});
			}
		}

		const keptForeignKeys = existing.foreignKeys.filter((foreignKey) => !foreignKeysToDrop.includes(foreignKey));

		await this.addForeignKeys(desiredTables, keptForeignKeys);
	}

	/**
	 * Adjust the `on_delete` of the planned foreign keys the same way it's done for regular relations, as not every
	 * vendor supports every action
	 */
	private applyVendorForeignKeyRules(tables: VersionTable[]): VersionTable[] {
		return tables.map((table) => ({
			...table,
			foreignKeys: table.foreignKeys.map((foreignKey) => {
				const relation = {
					collection: table.table,
					related_collection: foreignKey.foreign_key_table,
					schema: { on_delete: foreignKey.on_delete },
				} as Partial<Relation>;

				this.helpers.schema.preRelationChange(relation);

				return { ...foreignKey, on_delete: relation.schema!.on_delete };
			}),
		}));
	}

	private async dropForeignKeys(foreignKeys: ForeignKey[]) {
		for (const [table, tableForeignKeys] of Object.entries(groupBy(foreignKeys, 'table'))) {
			await this.knex.schema.alterTable(table, (builder) => {
				for (const foreignKey of tableForeignKeys) {
					builder.dropForeign(foreignKey.column, foreignKey.constraint_name ?? undefined);
				}
			});
		}
	}

	private async addForeignKeys(desiredTables: VersionTable[], existingForeignKeys: ForeignKey[]) {
		for (const table of desiredTables) {
			const foreignKeysToAdd = table.foreignKeys.filter(
				(desired) =>
					!existingForeignKeys.some(
						(existing) => existing.table === table.table && isSameForeignKey(existing, desired),
					),
			);

			if (foreignKeysToAdd.length === 0) continue;

			await this.knex.schema.alterTable(table.table, (builder) => {
				for (const foreignKey of foreignKeysToAdd) {
					const constraint = builder
						.foreign(foreignKey.column, getDefaultIndexName('foreign', table.table, foreignKey.column))
						.references(`${foreignKey.foreign_key_table}.${foreignKey.foreign_key_column}`);

					if (foreignKey.on_delete) {
						constraint.onDelete(foreignKey.on_delete);
					}
				}
			});
		}
	}

	private addColumn(
		fieldsService: FieldsService,
		builder: Knex.CreateTableBuilder,
		table: string,
		column: VersionTableColumn,
		existing?: Column,
	) {
		if (column.kind === 'meta') {
			this.addMetaColumn(builder, column.name);
			return;
		}

		if (column.kind === 'reference') {
			// `unsigned` is required to match `increments` in MySQL and ignored by all other vendors
			builder.integer(column.name).unsigned().nullable();
			return;
		}

		const { source } = column;
		const type = getLocalType(source);

		if (requiresExactType(source)) {
			const columnBuilder = builder.specificType(column.name, source.data_type);

			if (column.primary) {
				columnBuilder.primary().notNullable();
			} else {
				columnBuilder.nullable();
			}

			if (existing) columnBuilder.alter();

			return;
		}

		// All constraints apart from relations are removed from mirrored columns
		fieldsService.addColumnToTable(
			builder,
			table,
			{
				field: column.name,
				type: type as Type,
				schema: {
					max_length: source.max_length,
					numeric_precision: source.numeric_precision,
					numeric_scale: source.numeric_scale,
					default_value: null,
					is_nullable: !column.primary,
					is_primary_key: Boolean(column.primary),
				},
			},
			{ existing: existing ?? null },
		);
	}

	private addMetaColumn(builder: Knex.CreateTableBuilder, name: string) {
		switch (name) {
			case VERSION_META_FIELDS.id:
				builder.increments(name);
				break;
			case VERSION_META_FIELDS.name:
				builder.string(name).nullable();
				break;
			case VERSION_META_FIELDS.type:
				builder.string(name, 16).notNullable().defaultTo('draft');
				break;
			case VERSION_META_FIELDS.dateCreated:
				builder.timestamp(name, { useTz: true }).defaultTo(this.knex.fn.now());
				break;
			case VERSION_META_FIELDS.dateUpdated:
				builder.timestamp(name, { useTz: true }).nullable();
				break;
			case VERSION_META_FIELDS.userCreated:
			case VERSION_META_FIELDS.userUpdated:
				builder.uuid(name).nullable();
				break;
		}
	}
}

function getColumnChanges(desiredTables: VersionTable[], columns: ColumnsByTable) {
	const columnChanges = new Map<string, ColumnChanges>();

	for (const table of desiredTables) {
		const existingColumns = columns[table.table];

		if (!existingColumns) continue;

		const changes: ColumnChanges = {
			add: table.columns.filter((column) => !existingColumns[column.name]),
			alter: table.columns.filter((column) => {
				const existing = existingColumns[column.name];
				return existing && column.kind === 'mirror' && !column.primary && hasTypeChanged(column.source, existing);
			}),
			drop: Object.keys(existingColumns).filter((name) => !table.columns.some((column) => column.name === name)),
		};

		if (changes.add.length > 0 || changes.alter.length > 0 || changes.drop.length > 0) {
			columnChanges.set(table.table, changes);
		}
	}

	return columnChanges;
}

/**
 * Columns that are created with their database type instead of the Directus type. That's the case for types that don't
 * map to a Directus type, and for MySQL's unsigned integers, which map to `integer` but are created as signed integers
 * from it. MySQL doesn't accept foreign keys between signed and unsigned integers, so they have to match exactly.
 */
function requiresExactType(column: Column) {
	const type = getLocalType(column);

	return type === 'unknown' || type === 'alias' || column.data_type.toLowerCase().includes('unsigned');
}

function hasTypeChanged(source: Column, existing: Column) {
	const sourceType = getLocalType(source);

	if (sourceType !== getLocalType(existing)) return true;

	if (requiresExactType(source) || requiresExactType(existing)) {
		return source.data_type.toLowerCase() !== existing.data_type.toLowerCase();
	}

	return (
		source.max_length !== existing.max_length ||
		source.numeric_precision !== existing.numeric_precision ||
		source.numeric_scale !== existing.numeric_scale
	);
}

function isSameForeignKey(existing: ForeignKey, desired: VersionTableForeignKey) {
	return (
		existing.column === desired.column &&
		existing.foreign_key_table === desired.foreign_key_table &&
		existing.foreign_key_column === desired.foreign_key_column &&
		normalizeOnDelete(existing.on_delete) === normalizeOnDelete(desired.on_delete)
	);
}

// Vendors report the default action differently, all of them behave the same for our purposes
function normalizeOnDelete(onDelete: OnDelete) {
	return onDelete === null || onDelete === 'RESTRICT' ? 'NO ACTION' : onDelete;
}

function groupColumns(columns: Column[]) {
	const grouped: ColumnsByTable = {};

	for (const column of columns) {
		grouped[column.table] ??= {};
		grouped[column.table]![column.name] = column;
	}

	return grouped;
}

/**
 * `one_allowed_collections` is stored as a comma separated list
 */
function parseList(value: string | string[] | null | undefined): string[] | null {
	if (!value) return null;
	if (Array.isArray(value)) return value;

	return value.split(',').filter(Boolean);
}
