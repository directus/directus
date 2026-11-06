import type { Column, ForeignKey, SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import { systemRelationRows } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	PrimaryKey,
	Relation,
	RelationMeta,
	SchemaOverview,
	Type,
} from '@directus/types';
import type { Knex } from 'knex';
import { groupBy, keyBy, mapValues, sortBy } from 'lodash-es';
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

/** Columns keyed by table, then by column name */
type ColumnsByTable = Record<string, Record<string, Column>>;

/** Columns and foreign keys of a set of tables */
export type InspectedTables = {
	columns: Column[];
	foreignKeys: ForeignKey[];
};

export type SyncCollectionsOptions = {
	/** Also sync collections with a m2o / a2o relation to the given collections */
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
	 * Bring the version tables of the given collections in line with the current schema
	 */
	async syncCollections(collections: string[], options?: SyncCollectionsOptions): Promise<void> {
		const exclude = new Set(options?.exclude ?? []);
		const state = await this.readVersioningState(exclude);

		if (!state) return;

		if (options?.includeRelating) {
			const relating = await Promise.all(collections.map((collection) => this.getRelatingCollections(collection)));
			collections = [...collections, ...relating.flat()];
		}

		const scope = [...new Set(collections)].filter((collection) => !isVersionTable(collection));

		const existingTables = scope
			.flatMap((collection) => [getShadowTableName(collection), getLinkTableName(collection)])
			.filter((table) => state.versionTables.includes(table));

		await this.syncFromSchema({
			versioned: state.versioned,
			existing: { tables: existingTables, ...(await this.inspectTables(existingTables)) },
			live: await this.inspectTables(scope.filter((collection) => !exclude.has(collection))),
			relationsMeta: await this.readRelationsMeta(scope),
			exclude,
		});
	}

	/**
	 * Read the versioned collections and existing version tables.
	 * Returns `null` if neither exist, so projects without versioning skip the schema inspection.
	 */
	async readVersioningState(
		exclude: Set<string> = new Set(),
	): Promise<{ versioned: Set<string>; versionTables: string[] } | null> {
		const versioned = new Set((await this.readVersionedCollections()).filter((collection) => !exclude.has(collection)));
		const versionTables = (await this.schemaInspector.tables()).filter(isVersionTable);

		if (versioned.size === 0 && versionTables.length === 0) return null;

		return { versioned, versionTables };
	}

	/**
	 * Read the relation meta rows (including system ones) of the given "many" collections, or all if omitted
	 */
	async readRelationsMeta(collections?: string[]): Promise<RelationMeta[]> {
		const query = this.knex.select('*').from('directus_relations');

		if (collections) query.whereIn('many_collection', collections);

		const rows = (await query).map(
			(row: RelationMeta): RelationMeta => ({
				...row,
				one_allowed_collections: parseList(row.one_allowed_collections),
			}),
		);

		const systemRows = (systemRelationRows as RelationMeta[]).filter(
			(row) => !collections || collections.includes(row.many_collection),
		);

		return [...rows, ...systemRows];
	}

	/**
	 * Create, alter and drop version tables based on an already inspected schema
	 *
	 * @param input.existing - Version tables to sync, the ones no longer needed are dropped
	 * @param input.live - Live tables to derive the version tables from
	 * @param input.exclude - Collections to treat as deleted
	 */
	async syncFromSchema(input: {
		versioned: Set<string>;
		existing: { tables: string[] } & InspectedTables;
		live: InspectedTables;
		relationsMeta: RelationMeta[];
		exclude?: Set<string>;
	}): Promise<void> {
		const exclude = input.exclude ?? new Set();
		const isIncluded = (collection: string | null) => !collection || !exclude.has(collection);

		const relations = stitchRelations(input.relationsMeta, input.live.foreignKeys).filter((relation) =>
			isIncluded(relation.related_collection),
		);

		const relationsByCollection = groupBy(relations, 'collection');

		const liveCollections: LiveCollection[] = Object.entries(groupBy(input.live.columns, 'table'))
			.filter(([collection]) => isIncluded(collection))
			.map(([collection, columns]) => ({
				collection,
				columns,
				relations: relationsByCollection[collection] ?? [],
			}));

		const desired = this.applyVendorForeignKeyRules(planVersionTables(liveCollections, input.versioned));

		await this.applyChanges(desired, {
			tables: input.existing.tables,
			columns: mapValues(groupBy(input.existing.columns, 'table'), (columns) => keyBy(columns, 'name')),
			foreignKeys: input.existing.foreignKeys,
		});
	}

	/**
	 * Null out references to the given users in all shadow tables. Done manually before deleting users, as not every
	 * vendor allows a referential action on both user fields (same as for `directus_versions`).
	 */
	async clearUserReferences(keys: PrimaryKey[]): Promise<void> {
		if (keys.length === 0) return;

		for (const collection of await this.readVersionedCollections()) {
			const table = getShadowTableName(collection);

			// Versioned folders have no shadow table
			if (!(await this.schemaInspector.hasTable(table))) continue;

			for (const field of [VERSION_META_FIELDS.userCreated, VERSION_META_FIELDS.userUpdated]) {
				await this.knex(table)
					.update({ [field]: null })
					.whereIn(field, keys);
			}
		}
	}

	private async readVersionedCollections(): Promise<string[]> {
		const rows = await this.knex.select('collection').from('directus_collections').where('versioning', true);
		return rows.map(({ collection }) => collection);
	}

	private async inspectTables(tables: string[]): Promise<InspectedTables> {
		const result: InspectedTables = { columns: [], foreignKeys: [] };

		for (const table of tables) {
			result.columns.push(...(await this.schemaInspector.columnInfo(table)));
			result.foreignKeys.push(...(await this.schemaInspector.foreignKeys(table)));
		}

		return result;
	}

	/**
	 * Collections with a m2o / a2o relation to the given collection
	 */
	private async getRelatingCollections(collection: string): Promise<string[]> {
		const metaRows = await this.knex
			.select('many_collection', 'one_collection', 'one_allowed_collections')
			.from('directus_relations')
			.where('one_collection', collection)
			.orWhereNotNull('one_allowed_collections');

		const fromMeta = metaRows
			.filter(
				(row) => row.one_collection === collection || parseList(row.one_allowed_collections)?.includes(collection),
			)
			.map((row) => row.many_collection as string);

		// Relations without a meta row aren't managed by Directus, so the cached schema is still up to date for them
		const fromSchema = this.schema.relations
			.filter(
				(relation) =>
					relation.related_collection === collection || relation.meta?.one_allowed_collections?.includes(collection),
			)
			.map((relation) => relation.collection);

		return [...new Set([...fromMeta, ...fromSchema])].filter((relating) => !isVersionTable(relating));
	}

	/**
	 * Diff the desired version tables against the existing ones and apply the difference
	 */
	private async applyChanges(
		desired: VersionTable[],
		existing: { tables: string[]; columns: ColumnsByTable; foreignKeys: ForeignKey[] },
	): Promise<void> {
		const desiredByName = new Map(desired.map((table) => [table.table, table]));
		const columnChanges = getColumnChanges(desired, existing.columns);

		const tablesToDrop = existing.tables.filter((table) => !desiredByName.has(table));
		const tablesToCreate = desired.filter((table) => !existing.tables.includes(table.table));

		const isForeignKeyOutdated = (foreignKey: ForeignKey) => {
			const desiredTable = desiredByName.get(foreignKey.table);
			const changes = columnChanges.get(foreignKey.table);

			if (!desiredTable) return true;
			if (changes?.drop.includes(foreignKey.column)) return true;
			if (changes?.alter.some((column) => column.name === foreignKey.column)) return true;

			return !desiredTable.foreignKeys.some((desiredForeignKey) => isSameForeignKey(foreignKey, desiredForeignKey));
		};

		const foreignKeysToDrop = existing.foreignKeys.filter(isForeignKeyOutdated);
		const foreignKeysToKeep = existing.foreignKeys.filter((foreignKey) => !foreignKeysToDrop.includes(foreignKey));

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
					this.addColumn(fieldsService, builder, table, column, existing.columns[table]![column.name]);
				}
			});
		}

		await this.addForeignKeys(desired, foreignKeysToKeep);
	}

	/**
	 * Adjust `on_delete` of the foreign keys the same way as for regular relations, as not every vendor supports
	 * every action
	 */
	private applyVendorForeignKeyRules(tables: VersionTable[]): VersionTable[] {
		const isMssql = this.helpers.schema.isOneOfClients(['mssql']);

		return tables.map((table) => {
			const foreignKeys = table.foreignKeys.map((foreignKey) => {
				const relation: Partial<Relation> = {
					collection: table.table,
					related_collection: foreignKey.foreign_key_table,
					schema: { on_delete: foreignKey.on_delete } as Relation['schema'],
				};

				this.helpers.schema.preRelationChange(relation);

				return { ...foreignKey, on_delete: relation.schema!.on_delete };
			});

			return { ...table, foreignKeys: isMssql ? limitCascadePaths(foreignKeys) : foreignKeys };
		});
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

	private async addForeignKeys(desired: VersionTable[], existing: ForeignKey[]) {
		for (const table of desired) {
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

/**
 * Column changes per existing table. Tables without changes are left out.
 */
function getColumnChanges(desired: VersionTable[], existingColumns: ColumnsByTable) {
	const result = new Map<string, ColumnChanges>();

	for (const table of desired) {
		const existing = existingColumns[table.table];

		if (!existing) continue;

		const desiredNames = new Set(table.columns.map((column) => column.name));

		const changes: ColumnChanges = {
			add: table.columns.filter((column) => !existing[column.name]),
			alter: table.columns.filter((column) => {
				const current = existing[column.name];
				return current && column.kind === 'mirror' && !column.primary && hasTypeChanged(column.source, current);
			}),
			drop: Object.keys(existing).filter((name) => !desiredNames.has(name)),
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

/**
 * MSSQL rejects multiple cascade paths, i.e. more than one foreign key with a referential action to the same table.
 * Only the first one keeps its action. Mirrored columns go before the version meta fields, which are cleared manually.
 */
function limitCascadePaths(foreignKeys: VersionTableForeignKey[]): VersionTableForeignKey[] {
	const metaFields: string[] = Object.values(VERSION_META_FIELDS);
	const tablesWithAction = new Set<string>();
	const stripped = new Set<VersionTableForeignKey>();

	// `sortBy` is stable and sorts `false` before `true`
	for (const foreignKey of sortBy(foreignKeys, (foreignKey) => metaFields.includes(foreignKey.column))) {
		if (normalizeOnDelete(foreignKey.on_delete) === 'NO ACTION') continue;

		if (tablesWithAction.has(foreignKey.foreign_key_table)) stripped.add(foreignKey);
		else tablesWithAction.add(foreignKey.foreign_key_table);
	}

	return foreignKeys.map((foreignKey) => (stripped.has(foreignKey) ? { ...foreignKey, on_delete: null } : foreignKey));
}

function isSameForeignKey(existing: ForeignKey, desired: VersionTableForeignKey) {
	return (
		existing.column === desired.column &&
		existing.foreign_key_table === desired.foreign_key_table &&
		existing.foreign_key_column === desired.foreign_key_column &&
		normalizeOnDelete(existing.on_delete) === normalizeOnDelete(desired.on_delete)
	);
}

/** Vendors report the default action differently, but they all behave the same */
function normalizeOnDelete(onDelete: OnDelete) {
	return onDelete === null || onDelete === 'RESTRICT' ? 'NO ACTION' : onDelete;
}

/** `one_allowed_collections` is stored as a comma separated list */
function parseList(value: string | string[] | null | undefined): string[] | null {
	if (!value) return null;
	if (Array.isArray(value)) return value;

	return value.split(',').filter(Boolean);
}
