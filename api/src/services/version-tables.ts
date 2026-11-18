import { type Column, createInspector, type ForeignKey, type SchemaInspector } from '@directus/schema';
import { systemRelationRows } from '@directus/system-data';
import type { AbstractServiceOptions, Accountability, RelationMeta, SchemaOverview, Type } from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { groupBy, intersection, mapValues, partition, pickBy } from 'lodash-es';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import { getDefaultIndexName } from '../utils/get-default-index-name.js';
import getLocalType from '../utils/get-local-type.js';
import { stitchRelations } from '../utils/stitch-relations.js';
import { FieldsService } from './fields.js';
import { VERSION_SYSTEM_FIELDS } from './version-tables/constants.js';
import {
	type ColumnsByTable,
	getExactType,
	type InspectedTables,
	type LiveCollections,
	normalizeAction,
	type Plan,
	planVersioning,
	type VersionTableColumn,
} from './version-tables/plan-version-tables.js';
import { isVersioningTable } from './version-tables/utils.js';

/** Versioned collections, version tables, live tables and relation meta rows to plan a sync from */
type InspectedSchema = {
	versionedTables: Set<string>;
	shadowTables: InspectedTables;
	liveTables: InspectedTables;
	relationsMeta: RelationMeta[];
};

export type SyncCollectionsOptions = {
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
	 * @param collections - Collections to sync, excluding shadow/link tables, together with the collections that have a m2o / a2o relation to them. Syncs every version table if omitted.
	 */
	async syncCollections(collections: string[] | null, options?: SyncCollectionsOptions): Promise<void> {
		const exclude = new Set(options?.exclude ?? []);

		if (collections) {
			collections = this.resolveRelatedCollections(collections);
		}

		const inspected = await this.inspect(exclude, collections);

		if (!inspected) return;

		const { versionedTables, shadowTables, liveTables, relationsMeta } = inspected;

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

		const plan = planVersioning(liveCollections, versionedTables, shadowTables, this.helpers.versioning);

		await this.applyPlan(plan);
	}

	/**
	 * Add the collections with a m2o / a2o relation to the given collections
	 */
	private resolveRelatedCollections(collections: string[]): string[] {
		const relatingCollections = this.schema.relations
			.filter(
				(relation) =>
					(relation.related_collection && collections.includes(relation.related_collection)) ||
					intersection(relation.meta?.one_allowed_collections, collections).length > 0,
			)
			.map((relation) => relation.collection);

		return [...new Set([...collections, ...relatingCollections])];
	}

	/**
	 * Inspect the versioned collections, version tables and live tables of the given collections, or all if omitted.
	 * Returns `null` if there is nothing to sync.
	 */
	private async inspect(exclude: Set<string>, collections: string[] | null): Promise<InspectedSchema | null> {
		const rows = await this.knex
			.select('collection')
			.from('directus_collections')
			.where('versioning', true)
			.whereNotIn('collection', [...exclude]);

		const versionedTables = new Set<string>(rows.map(({ collection }) => collection));

		if (collections) {
			// Probe for the few candidates instead of listing every table of the database on each schema change
			const candidates = this.helpers.versioning.getVersionTableNames(collections);
			const exists = await Promise.all(candidates.map((table) => this.schemaInspector.hasTable(table)));
			const shadowTables = candidates.filter((_table, index) => exists[index]);

			if (versionedTables.size === 0 && shadowTables.length === 0) return null;

			return {
				versionedTables,
				shadowTables: await this.inspectTables(shadowTables),
				liveTables: await this.inspectTables(collections.filter((collection) => !exclude.has(collection))),
				relationsMeta: await this.readRelationsMeta(collections),
			};
		}

		if (versionedTables.size === 0 && !(await this.schemaInspector.tables()).some(isVersioningTable)) return null;

		// Inspecting the whole database at once is a lot faster than table by table
		const [shadowColumns, liveColumns] = partition(await this.schemaInspector.columnInfo(), (column) =>
			isVersioningTable(column.table),
		);

		const [shadowForeignKeys, liveForeignKeys] = partition(await this.schemaInspector.foreignKeys(), (foreignKey) =>
			isVersioningTable(foreignKey.table),
		);

		return {
			versionedTables,
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

	private async applyPlan(plan: Plan): Promise<void> {
		for (const [table, foreignKeys] of Object.entries(groupBy(plan.foreignKeys.drop, 'table'))) {
			await this.knex.schema.alterTable(table, (builder) => {
				for (const foreignKey of foreignKeys) {
					builder.dropForeign(foreignKey.column, foreignKey.constraint_name ?? undefined);
				}
			});
		}

		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		for (const table of plan.tables.drop) {
			await this.knex.schema.dropTable(table);
		}

		for (const table of plan.tables.create) {
			await this.knex.schema.createTable(table.table, (builder) => {
				for (const column of table.columns) {
					this.addColumn(fieldsService, builder, table.table, column);
				}
			});
		}

		for (const [table, alteration] of Object.entries(plan.tables.alter)) {
			await this.knex.schema.alterTable(table, (builder) => {
				if (alteration.drop.length > 0) builder.dropColumns(...alteration.drop);

				for (const column of alteration.add) {
					this.addColumn(fieldsService, builder, table, column);
				}

				for (const { column, existing } of alteration.alter) {
					this.addColumn(fieldsService, builder, table, column, existing);
				}
			});
		}

		for (const [table, foreignKeys] of Object.entries(plan.foreignKeys.add)) {
			await this.knex.schema.alterTable(table, (builder) => {
				for (const foreignKey of foreignKeys) {
					const constraint = builder
						.foreign(foreignKey.column, getDefaultIndexName('foreign', table, foreignKey.column))
						.references(`${foreignKey.foreign_key_table}.${foreignKey.foreign_key_column}`);

					if (foreignKey.on_delete) constraint.onDelete(foreignKey.on_delete);
					if (normalizeAction(foreignKey.on_update) !== 'NO ACTION') constraint.onUpdate(foreignKey.on_update!);
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
		if (column.kind === 'system') {
			this.addSystemColumn(builder, column.name);
			return;
		}

		if (column.kind === 'reference') {
			// `unsigned` matches `increments` in MySQL, other vendors ignore it
			builder.integer(column.name).unsigned().nullable();
			return;
		}

		const { source } = column;
		const type = getLocalType(source);
		const exactType = getExactType(this.helpers.versioning, source);

		// Altering through Directus would re-add the primary key and drop its `not null`, which Postgres rejects
		if (column.primary && existing) {
			let fullType = exactType ?? source.data_type;

			if (!exactType && type === 'decimal') fullType += `(${source.numeric_precision},${source.numeric_scale})`;
			if (!exactType && type === 'string' && source.max_length !== null) fullType += `(${source.max_length})`;

			builder.specificType(column.name, fullType).notNullable().alter({ alterNullable: false });
			return;
		}

		// Knex would default strings without a length to 255. MSSQL's `nvarchar(max)` is handled by `addColumnToTable`.
		const isUnboundedString =
			type === 'string' && source.max_length === null && !this.helpers.schema.isOneOfClients(['mssql']);

		if (exactType || isUnboundedString) {
			const columnBuilder = builder.specificType(column.name, exactType ?? source.data_type);

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

	private addSystemColumn(builder: Knex.CreateTableBuilder, name: string) {
		switch (name) {
			case VERSION_SYSTEM_FIELDS.id:
				builder.increments(name);
				break;
			case VERSION_SYSTEM_FIELDS.name:
				builder.string(name).nullable();
				break;
			case VERSION_SYSTEM_FIELDS.type:
				builder.string(name, 16).notNullable().defaultTo('draft');
				break;
			case VERSION_SYSTEM_FIELDS.dateCreated:
				builder.timestamp(name, { useTz: true }).defaultTo(this.knex.fn.now());
				break;
			case VERSION_SYSTEM_FIELDS.dateUpdated:
				builder.timestamp(name, { useTz: true }).nullable();
				break;
			case VERSION_SYSTEM_FIELDS.userCreated:
			case VERSION_SYSTEM_FIELDS.userUpdated:
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
