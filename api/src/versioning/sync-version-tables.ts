import type { Column, ForeignKey } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { Relation, Type } from '@directus/types';
import type { Knex } from 'knex';
import { groupBy } from 'lodash-es';
import { getHelpers } from '../database/helpers/index.js';
import { FieldsService } from '../services/fields.js';
import { getDefaultIndexName } from '../utils/get-default-index-name.js';
import getLocalType from '../utils/get-local-type.js';
import { getSchema } from '../utils/get-schema.js';
import { isVersionTable, VERSION_META_FIELDS } from './constants.js';
import {
	type OnDelete,
	planVersionTables,
	type VersionTableColumn,
	type VersionTableForeignKey,
} from './plan-version-tables.js';

export type SyncVersionTablesOptions = {
	/**
	 * Collections to treat as if they no longer exist, used to clean up version tables before a live table is dropped
	 */
	exclude?: string[];
};

/**
 * Create, alter and drop the shadow and link tables so they match the current schema and versioning settings.
 * Meant to be run within the same transaction as the change to the live schema.
 */
export async function syncVersionTables(knex: Knex, options?: SyncVersionTablesOptions): Promise<void> {
	const inspector = createInspector(knex);
	const exclude = new Set(options?.exclude ?? []);

	const versioned = new Set<string>(
		(await knex.select('collection').from('directus_collections').where('versioning', true))
			.map(({ collection }) => collection)
			.filter((collection) => !exclude.has(collection)),
	);

	const existingTables = (await inspector.tables()).filter(isVersionTable);

	// Prevents reading the whole schema on every schema change for projects that don't use versioning
	if (versioned.size === 0 && existingTables.length === 0) return;

	const schema = await getSchema({ database: knex, bypassCache: true });

	for (const collection of exclude) {
		delete schema.collections[collection];
	}

	const columns = groupColumns(await inspector.columnInfo());
	const desiredTables = planVersionTables(schema, versioned, columns);
	const desiredByName = new Map(desiredTables.map((table) => [table.table, table]));

	const helpers = getHelpers(knex);

	for (const table of desiredTables) {
		table.foreignKeys = table.foreignKeys.map((foreignKey) => {
			const relation = {
				collection: table.table,
				related_collection: foreignKey.foreign_key_table,
				schema: { on_delete: foreignKey.on_delete },
			} as Partial<Relation>;

			helpers.schema.preRelationChange(relation);

			return { ...foreignKey, on_delete: relation.schema!.on_delete };
		});
	}

	const tablesToDrop = existingTables.filter((table) => !desiredByName.has(table));
	const tablesToCreate = desiredTables.filter((table) => !existingTables.includes(table.table));
	const columnChanges = new Map<string, { add: VersionTableColumn[]; alter: VersionTableColumn[]; drop: string[] }>();

	for (const table of desiredTables) {
		const existingColumns = columns[table.table];

		if (!existingColumns) continue;

		const changes = {
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

	// Foreign keys are dropped first, so tables and columns can be dropped / altered regardless of their order
	const existingForeignKeys = (await inspector.foreignKeys()).filter((foreignKey) => isVersionTable(foreignKey.table));

	const foreignKeysToDrop = existingForeignKeys.filter((foreignKey) => {
		const desired = desiredByName.get(foreignKey.table);
		const changes = columnChanges.get(foreignKey.table);

		if (!desired) return true;
		if (changes?.drop.includes(foreignKey.column)) return true;
		if (changes?.alter.some((column) => column.name === foreignKey.column)) return true;

		return !desired.foreignKeys.some((desiredForeignKey) => isSameForeignKey(foreignKey, desiredForeignKey));
	});

	for (const [table, foreignKeys] of Object.entries(groupBy(foreignKeysToDrop, 'table'))) {
		await knex.schema.alterTable(table, (builder) => {
			for (const foreignKey of foreignKeys) {
				builder.dropForeign(foreignKey.column, foreignKey.constraint_name ?? undefined);
			}
		});
	}

	for (const table of tablesToDrop) {
		await knex.schema.dropTable(table);
	}

	const fieldsService = new FieldsService({ knex, schema });

	for (const table of tablesToCreate) {
		await knex.schema.createTable(table.table, (builder) => {
			for (const column of table.columns) {
				addColumn(knex, fieldsService, builder, table.table, column);
			}
		});
	}

	for (const [table, changes] of columnChanges) {
		await knex.schema.alterTable(table, (builder) => {
			if (changes.drop.length > 0) builder.dropColumns(...changes.drop);

			for (const column of changes.add) {
				addColumn(knex, fieldsService, builder, table, column);
			}

			for (const column of changes.alter) {
				addColumn(knex, fieldsService, builder, table, column, columns[table]![column.name]);
			}
		});
	}

	const keptForeignKeys = existingForeignKeys.filter((foreignKey) => !foreignKeysToDrop.includes(foreignKey));

	for (const table of desiredTables) {
		const foreignKeysToAdd = table.foreignKeys.filter(
			(desired) =>
				!keptForeignKeys.some((existing) => existing.table === table.table && isSameForeignKey(existing, desired)),
		);

		if (foreignKeysToAdd.length === 0) continue;

		await knex.schema.alterTable(table.table, (builder) => {
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

function addColumn(
	knex: Knex,
	fieldsService: FieldsService,
	builder: Knex.CreateTableBuilder,
	table: string,
	column: VersionTableColumn,
	existing?: Column,
) {
	if (column.kind === 'meta') {
		addMetaColumn(knex, builder, column.name);
		return;
	}

	if (column.kind === 'reference') {
		// `unsigned` is required to match `increments` in MySQL and ignored by all other vendors
		builder.integer(column.name).unsigned().nullable();
		return;
	}

	const { source } = column;
	const type = getLocalType(source);

	// Types like MySQL's `int unsigned` don't map to a Directus type, but have to match exactly for foreign keys
	if (type === 'unknown' || type === 'alias') {
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

function addMetaColumn(knex: Knex, builder: Knex.CreateTableBuilder, name: string) {
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
			builder.timestamp(name, { useTz: true }).defaultTo(knex.fn.now());
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

function hasTypeChanged(source: Column, existing: Column) {
	const sourceType = getLocalType(source);

	if (sourceType !== getLocalType(existing)) return true;
	if (sourceType === 'unknown') return source.data_type !== existing.data_type;

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
	const grouped: Record<string, Record<string, Column>> = {};

	for (const column of columns) {
		grouped[column.table] ??= {};
		grouped[column.table]![column.name] = column;
	}

	return grouped;
}
