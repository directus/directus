import { type Column, createInspector, type ForeignKey, type SchemaInspector } from '@directus/schema';
import { systemRelationRows } from '@directus/system-data';
import type { AbstractServiceOptions, Accountability, RelationMeta, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { groupBy, mapValues, partition, pickBy } from 'lodash-es';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase, { getSchemaInspector } from '../database/index.js';
import { getDefaultIndexName } from '../utils/get-default-index-name.js';
import { stitchRelations } from '../utils/stitch-relations.js';
import { VERSION_SYSTEM_FIELDS } from './version-tables/constants.js';
import {
	type ColumnsByTable,
	type InspectedTables,
	type LiveCollections,
	normalizeAction,
	type Plan,
	planVersioning,
	type VersionTableColumn,
} from './version-tables/plan-version-tables.js';
import { isVersioningTable } from './version-tables/utils.js';

/** Versioned collections, version tables and live collections to plan a sync from */
export type InspectedSchema = {
	versionedTables: Set<string>;
	shadowTables: InspectedTables;
	liveCollections: LiveCollections;
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
			const related = this.getReferencingCollections(collections);
			collections.push(...related);
		}

		const inspected = await this.inspect(exclude, collections);

		if (!inspected) return;

		const plan = planVersioning(inspected, this.helpers.versioning);

		await this.applyPlan(plan);
	}

	/**
	 * Add the collections with a m2o / a2o relation to the given collections
	 */
	private getReferencingCollections(collections: string[]): string[] {
		const based = new Set(collections);

		return this.schema.relations
			.filter(
				(relation) =>
					((relation.related_collection && based.has(relation.related_collection)) ||
						relation.meta?.one_allowed_collections?.some((collection) => based.has(collection))) &&
					!based.has(relation.collection),
			)
			.map((relation) => relation.collection);
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

			const shadowTablesInspected = await this.inspectTables(shadowTables);
			const liveTables = await this.inspectTables(collections.filter((collection) => !exclude.has(collection)));

			return {
				versionedTables,
				shadowTables: shadowTablesInspected,
				liveCollections: toLiveCollections(liveTables, await this.readRelationsMeta(collections), exclude),
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
			liveCollections: toLiveCollections(
				{ columns: keyColumns(liveColumns), foreignKeys: liveForeignKeys },
				await this.readRelationsMeta(),
				exclude,
			),
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

		for (const table of plan.dropTables) {
			await this.knex.schema.dropTable(table);
		}

		for (const table of plan.createTables) {
			await this.knex.schema.createTable(table.table, (builder) => {
				for (const column of table.columns) {
					this.addColumn(builder, column);
				}
			});
		}

		for (const [table, alteration] of Object.entries(plan.alterTables)) {
			await this.knex.schema.alterTable(table, (builder) => {
				if (alteration.drop.length > 0) builder.dropColumns(...alteration.drop);

				for (const column of alteration.add) {
					this.addColumn(builder, column);
				}

				for (const { column, existing } of alteration.alter) {
					this.addColumn(builder, column, existing);
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
	private addColumn(builder: Knex.CreateTableBuilder, column: VersionTableColumn, existing?: Column) {
		if (column.kind === 'system') {
			this.addSystemColumn(builder, column.name);
			return;
		}

		if (column.kind === 'reference') {
			// `unsigned` matches `increments` in MySQL, other vendors ignore it
			builder.integer(column.name).unsigned().nullable();
			return;
		}

		const columnBuilder = builder.specificType(column.name, column.type);
		const nullable = !column.primary;

		if (!existing) {
			if (column.primary) columnBuilder.primary().notNullable();
			else columnBuilder.nullable();

			return;
		}

		// Only touch the nullability when it changes: Oracle rejects setting the one a column already has and Postgres
		// can't drop the `not null` of a primary key. Re-adding the primary key while altering would fail as well
		if (existing.is_nullable === nullable) {
			columnBuilder.alter({ alterNullable: false });
			return;
		}

		if (nullable) columnBuilder.nullable();
		else columnBuilder.notNullable();

		columnBuilder.alter();
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

/**
 * Combine the live tables with their stitched relations, dropping excluded collections and relations to them
 */
function toLiveCollections(
	liveTables: InspectedTables,
	relationsMeta: RelationMeta[],
	exclude: Set<string>,
): LiveCollections {
	const relations = stitchRelations(relationsMeta, liveTables.foreignKeys).filter(
		(relation) => !relation.related_collection || !exclude.has(relation.related_collection),
	);

	const relationsByCollection = groupBy(relations, 'collection');

	return mapValues(
		pickBy(liveTables.columns, (_columns, collection) => !exclude.has(collection)),
		(columns, collection) => ({
			collection,
			columns: Object.values(columns),
			relations: relationsByCollection[collection] ?? [],
		}),
	);
}
