import { type Column, createInspector, type ForeignKey, type SchemaInspector } from '@directus/schema';
import { systemRelationRows } from '@directus/system-data';
import type { AbstractServiceOptions, Accountability, RelationMeta, SchemaOverview, Type } from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { groupBy, intersection, mapValues, partition, pickBy, uniq } from 'lodash-es';
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
	isShadowTable,
	VERSION_META_FIELDS,
} from './version-tables/constants.js';
import {
	type LiveCollections,
	normalizeOnDelete,
	planShadowTables,
	type VersionTableColumn,
	type VersionTableForeignKey,
	type VersionTables,
} from './version-tables/plan-version-tables.js';

/** Names of the shadow and link table of each given collection */
function getVersionTableNames(collections: string[]): string[] {
	return collections.flatMap((collection) => [getShadowTableName(collection), getLinkTableName(collection)]);
}

type ColumnChanges = { add: VersionTableColumn[]; alter: VersionTableColumn[]; drop: string[] };

/** Columns keyed by table, then by column name */
type ColumnsByTable = Record<string, Record<string, Column>>;

/** Columns and foreign keys of a set of tables */
export type InspectedTables = {
	columns: ColumnsByTable;
	foreignKeys: ForeignKey[];
};

/** Version tables, live tables and relation meta rows to plan a sync from */
type InspectedSchema = {
	shadowTables: InspectedTables;
	liveTables: InspectedTables;
	relationsMeta: RelationMeta[];
};

export type SyncCollectionsOptions = {
	/** Also sync collections with a m2o / a2o relation to the given collections, ignored when syncing all */
	includeRelating?: boolean;
	/** Collections to treat as deleted */
	exclude?: string[];
};

/**
 * Manages the shadow and link tables of versioned collections.
 *
 * Should run in the same transaction as the live schema change, after it was made.
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
	 * Bring the version tables in line with the current schema
	 *
	 * @param collections - Collections to sync, excluding shadow/link tables. Syncs every version table if omitted.
	 */
	async syncCollections(collections?: string[], options?: SyncCollectionsOptions): Promise<void> {
		const exclude = new Set(options?.exclude ?? []);

		if (collections && options?.includeRelating) collections = this.resolveRelatedCollections(collections);

		const state = await this.readVersioningState(exclude, collections);

		if (!state) return;

		const { shadowTables, liveTables, relationsMeta } = collections
			? await this.inspectCollections(collections, state.shadowTables, exclude)
			: await this.inspectAll();

		const isIncluded = (collection: string | null) => !collection || !exclude.has(collection);

		const relations = stitchRelations(relationsMeta, liveTables.foreignKeys).filter((relation) =>
			isIncluded(relation.related_collection),
		);

		const relationsByCollection = groupBy(relations, 'collection');

		const liveCollections: LiveCollections = mapValues(
			pickBy(liveTables.columns, (_columns, collection) => isIncluded(collection)),
			(columns, collection) => ({
				collection,
				columns: Object.values(columns),
				relations: relationsByCollection[collection] ?? [],
			}),
		);

		let plannedShadowTables = planShadowTables(liveCollections, state.versionedTables);
		plannedShadowTables = this.helpers.schema.applyShadowForeignKeyRules(plannedShadowTables);

		await this.applyChanges(plannedShadowTables, shadowTables);
	}

	/**
	 * Add the collections with a m2o / a2o relation to the given collections, if requested
	 */
	private resolveRelatedCollections(collections: string[]): string[] {
		const relatingCollections = this.schema.relations
			.filter(
				(relation) =>
					(relation.related_collection && collections.includes(relation.related_collection)) ||
					intersection(relation.meta?.one_allowed_collections, collections).length > 0,
			)
			.map((relation) => relation.collection);

		collections = [...collections, ...relatingCollections];

		return uniq(collections);
	}

	/**
	 * Read the versioned collections and existing version tables, limited to the ones of the given collections.
	 * Returns `null` if neither exist, so projects without versioning skip the schema inspection.
	 */
	private async readVersioningState(
		exclude: Set<string>,
		collections?: string[],
	): Promise<{ versionedTables: Set<string>; shadowTables: string[] } | null> {
		const rows = await this.knex
			.select('collection')
			.from('directus_collections')
			.where('versioning', true)
			.whereNotIn('collection', [...exclude]);

		const versionedTables = new Set<string>(rows.map(({ collection }) => collection));

		// Without versioned collections, only leftover version tables of the given collections have to be dropped.
		// Probe for those instead of listing every table of the database on each schema change.
		const shadowTables =
			versionedTables.size === 0 && collections
				? await this.filterExistingTables(getVersionTableNames(collections))
				: (await this.schemaInspector.tables()).filter(isShadowTable);

		if (versionedTables.size === 0 && shadowTables.length === 0) return null;

		return { versionedTables, shadowTables };
	}

	private async filterExistingTables(tables: string[]): Promise<string[]> {
		const exists = await Promise.all(tables.map((table) => this.schemaInspector.hasTable(table)));

		return tables.filter((_table, index) => exists[index]);
	}

	/**
	 * Inspect the version tables and live tables of the given collections only, table by table
	 */
	private async inspectCollections(
		collections: string[],
		allShadowTables: string[],
		exclude: Set<string>,
	): Promise<InspectedSchema> {
		// Only the version tables of these collections, so the ones of other collections aren't dropped
		const shadowTables = getVersionTableNames(collections).filter((table) => allShadowTables.includes(table));

		return {
			shadowTables: await this.inspectTables(shadowTables),
			liveTables: await this.inspectTables(collections.filter((collection) => !exclude.has(collection))),
			relationsMeta: await this.readRelationsMeta(collections),
		};
	}

	/**
	 * Inspect every version table and live table. Inspecting the whole database at once is a lot faster than
	 * inspecting each table on its own.
	 */
	private async inspectAll(): Promise<InspectedSchema> {
		const [shadowColumns, liveColumns] = partition(await this.schemaInspector.columnInfo(), (column) =>
			isShadowTable(column.table),
		);

		const [shadowForeignKeys, liveForeignKeys] = partition(await this.schemaInspector.foreignKeys(), (foreignKey) =>
			isShadowTable(foreignKey.table),
		);

		return {
			shadowTables: { columns: keyColumns(shadowColumns), foreignKeys: shadowForeignKeys },
			liveTables: { columns: keyColumns(liveColumns), foreignKeys: liveForeignKeys },
			relationsMeta: await this.readRelationsMeta(),
		};
	}

	/**
	 * Read the relation meta rows (including system ones) of the given "many" collections, or all if omitted
	 */
	private async readRelationsMeta(collections?: string[]): Promise<RelationMeta[]> {
		const query = this.knex.select('*').from('directus_relations');

		if (collections) query.whereIn('many_collection', collections);

		const rows = (await query).map(
			(row: RelationMeta): RelationMeta => ({
				...row,
				one_allowed_collections: row.one_allowed_collections ? toArray(row.one_allowed_collections) : null,
			}),
		);

		const systemRows = (systemRelationRows as RelationMeta[]).filter(
			(row) => !collections || collections.includes(row.many_collection),
		);

		return [...rows, ...systemRows];
	}

	private async inspectTables(tables: string[]): Promise<InspectedTables> {
		const columns: Column[] = [];
		const foreignKeys: ForeignKey[] = [];

		for (const table of tables) {
			columns.push(...(await this.schemaInspector.columnInfo(table)));
			foreignKeys.push(...(await this.schemaInspector.foreignKeys(table)));
		}

		return { columns: keyColumns(columns), foreignKeys };
	}

	/**
	 * Diff the planned version tables against the current shadow tables and apply the difference
	 */
	private async applyChanges(planned: VersionTables, shadow: InspectedTables): Promise<void> {
		const columnChanges = getColumnChanges(planned, shadow.columns);

		const tablesToDrop = Object.keys(shadow.columns).filter((table) => !planned[table]);
		const tablesToCreate = Object.values(planned).filter((table) => !shadow.columns[table.table]);

		const isForeignKeyOutdated = (foreignKey: ForeignKey) => {
			const plannedTable = planned[foreignKey.table];
			const changes = columnChanges.get(foreignKey.table);

			if (!plannedTable) return true;
			if (changes?.drop.includes(foreignKey.column)) return true;
			if (changes?.alter.some((column) => column.name === foreignKey.column)) return true;

			return !plannedTable.foreignKeys.some((plannedForeignKey) => isSameForeignKey(foreignKey, plannedForeignKey));
		};

		const foreignKeysToDrop = shadow.foreignKeys.filter(isForeignKeyOutdated);
		const foreignKeysToKeep = shadow.foreignKeys.filter((foreignKey) => !foreignKeysToDrop.includes(foreignKey));

		// Drop foreign keys first, so tables and columns can be changed in any order
		await this.dropForeignKeys(foreignKeysToDrop);

		for (const table of tablesToDrop) {
			await this.knex.schema.dropTable(table);
		}

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
					this.addColumn(fieldsService, builder, table, column, shadow.columns[table]![column.name]);
				}
			});
		}

		await this.addForeignKeys(planned, foreignKeysToKeep);
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

	private async addForeignKeys(planned: VersionTables, existing: ForeignKey[]) {
		for (const table of Object.values(planned)) {
			const missing = table.foreignKeys.filter(
				(foreignKey) => !existing.some((other) => other.table === table.table && isSameForeignKey(other, foreignKey)),
			);

			if (missing.length === 0) continue;

			await this.knex.schema.alterTable(table.table, (builder) => {
				for (const foreignKey of missing) {
					const constraint = builder
						.foreign(foreignKey.column, getDefaultIndexName('foreign', table.table, foreignKey.column))
						.references(`${foreignKey.foreign_key_table}.${foreignKey.foreign_key_column}`);

					if (foreignKey.on_delete) constraint.onDelete(foreignKey.on_delete);
				}
			});
		}
	}

	/**
	 * Add a column to the builder, or alter it if `existing` is given
	 */
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
			// `unsigned` matches `increments` in MySQL, other vendors ignore it
			builder.integer(column.name).unsigned().nullable();
			return;
		}

		const { source } = column;
		const type = getLocalType(source);

		// Knex would default strings without a length to 255. MSSQL's `nvarchar(max)` is handled by `addColumnToTable`.
		const isUnboundedString =
			type === 'string' && source.max_length === null && !this.helpers.schema.isOneOfClients(['mssql']);

		if (requiresExactType(source) || isUnboundedString) {
			const columnBuilder = builder.specificType(column.name, source.data_type);

			if (column.primary) columnBuilder.primary().notNullable();
			else columnBuilder.nullable();

			if (existing) columnBuilder.alter();

			return;
		}

		// Mirrored columns drop all constraints apart from relations
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

// Groups columns by table and name
function keyColumns(columns: Column[]): ColumnsByTable {
	const result: ColumnsByTable = {};

	for (const column of columns) {
		(result[column.table] ??= {})[column.name] = column;
	}

	return result;
}

/**
 * Column changes per existing table. Tables without changes are left out.
 */
function getColumnChanges(planned: VersionTables, existingColumns: ColumnsByTable) {
	const result = new Map<string, ColumnChanges>();

	for (const table of Object.values(planned)) {
		const existing = existingColumns[table.table];

		if (!existing) continue;

		const plannedNames = new Set(table.columns.map((column) => column.name));

		const changes: ColumnChanges = {
			add: table.columns.filter((column) => !existing[column.name]),
			alter: table.columns.filter((column) => {
				const current = existing[column.name];
				return current && column.kind === 'mirror' && !column.primary && hasTypeChanged(column.source, current);
			}),
			drop: Object.keys(existing).filter((name) => !plannedNames.has(name)),
		};

		if (changes.add.length || changes.alter.length || changes.drop.length) {
			result.set(table.table, changes);
		}
	}

	return result;
}

/**
 * Whether a column has to be created with its raw database type: types without a Directus equivalent, and MySQL
 * unsigned integers (Directus would create them signed, which breaks foreign keys to them).
 */
function requiresExactType(column: Column) {
	const type = getLocalType(column);

	return type === 'unknown' || type === 'alias' || column.data_type.toLowerCase().includes('unsigned');
}

function hasTypeChanged(source: Column, existing: Column) {
	if (getLocalType(source) !== getLocalType(existing)) return true;

	if (requiresExactType(source) || requiresExactType(existing)) {
		return source.data_type.toLowerCase() !== existing.data_type.toLowerCase();
	}

	return (
		source.max_length !== existing.max_length ||
		source.numeric_precision !== existing.numeric_precision ||
		source.numeric_scale !== existing.numeric_scale
	);
}

function isSameForeignKey(existing: ForeignKey, planned: VersionTableForeignKey) {
	return (
		existing.column === planned.column &&
		existing.foreign_key_table === planned.foreign_key_table &&
		existing.foreign_key_column === planned.foreign_key_column &&
		normalizeOnDelete(existing.on_delete) === normalizeOnDelete(planned.on_delete)
	);
}
