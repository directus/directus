import type { Column, ForeignKey } from '@directus/schema';
import type { Relation } from '@directus/types';
import { keyBy } from 'lodash-es';
import type { VersioningHelper } from '../../database/helpers/versioning/types.js';
import type { VersioningState } from '../version-tables.js';
import { VERSION_SYSTEM_FIELDS } from './constants.js';
import { assertVersionSystemField, isVersioningTable } from './utils.js';

export type ReferentialAction = ForeignKey['on_delete'];

/** Vendors report the default action differently, but they all behave the same */
export function normalizeAction(action: ReferentialAction) {
	return action === null || action === 'RESTRICT' ? 'NO ACTION' : action;
}

/** Copy of a live column */
export type MirrorColumn = {
	kind: 'mirror';
	name: string;
	source: Column;
	/** Database type as declared on the live column */
	type: string;
	primary?: boolean;
};

export type VersionTableColumn =
	| { kind: 'system'; name: string }
	| MirrorColumn
	/** Reference to the `version_id` of a shadow table */
	| { kind: 'reference'; name: string };

export type VersionTableForeignKey = {
	column: string;
	foreign_key_table: string;
	foreign_key_column: string;
	on_delete: ReferentialAction;
	on_update: ReferentialAction;
};

export type VersionTable = {
	table: string;
	type: 'shadow' | 'link';
	columns: VersionTableColumn[];
	foreignKeys: VersionTableForeignKey[];
};

/**
 * A live collection together with everything needed to plan its version tables
 */
export type LiveCollection = {
	collection: string;
	columns: Column[];
	relations: Relation[];
};

export type VersionTables = Record<string, VersionTable>;
export type LiveCollections = Record<string, LiveCollection>;

export type TableAlteration = {
	create: VersionTableColumn[];
	update: { column: MirrorColumn; existing: Column }[];
	drop: string[];
};

export type Plan = {
	tables: { create: VersionTable[]; update: Record<string, TableAlteration>; drop: string[] };
	foreignKeys: { create: Record<string, VersionTableForeignKey[]>; drop: Record<string, ForeignKey[]> };
};

type TableChanges = Plan['tables'];

/**
 * Plan the changes to the version tables of the given live collections. Only the version tables of these collections
 * are planned, so `existing` is expected to hold just their version tables: any other table in it is dropped.
 *
 * @param schema - Inspected Schema
 * @param helper - Provides the vendor specific names and foreign key rules of the version tables
 */
export function planVersioning(schema: VersioningState, helper: VersioningHelper): Plan {
	const { sourceCollections, versionTables, versionedCollections } = schema;

	const spec = getVersionSpec(sourceCollections, { versioned: versionedCollections, helper });
	const tables = diffTables(spec, versionTables.columns);
	const foreignKeys = diffForeignKeys(spec, tables, versionTables.foreignKeys);

	return { tables, foreignKeys };
}

/**
 * Compute the shadow and link tables that should exist for the given live collections
 */
function getVersionSpec(collections: LiveCollections, context: PlanContext): VersionTables {
	const tables: VersionTables = {};

	for (const collection of Object.values(collections)) {
		if (isVersioningTable(collection.collection)) continue;

		if (context.versioned.has(collection.collection)) {
			const shadowTable = buildShadowTable(collection, context);
			tables[shadowTable.table] = shadowTable;
		}

		const primaryKeyColumn = getPrimaryKeyColumn(collection);

		if (!primaryKeyColumn) continue;

		const hasVersionedO2M = collection.relations.some(
			(relation) =>
				relation.field !== primaryKeyColumn.name &&
				relation.meta?.one_field &&
				relation.related_collection &&
				context.versioned.has(relation.related_collection),
		);

		if (!hasVersionedO2M) continue;

		const linkTable = buildLinkTable(collection, primaryKeyColumn, context);

		tables[linkTable.table] = linkTable;
	}

	return tables;
}

/**
 * Diff the target tables against the existing ones
 */
function diffTables(spec: VersionTables, existingTables: Record<string, Column[]>): TableChanges {
	const changes: TableChanges = {
		drop: Object.keys(existingTables).filter((table) => !spec[table]),
		create: [],
		update: {},
	};

	for (const table of Object.values(spec)) {
		const existing = existingTables[table.table];

		if (!existing) {
			changes.create.push(table);
			continue;
		}

		const columns = keyBy(existing, 'name');

		const plannedNames = new Set(table.columns.map((column) => column.name));

		const alteration: TableAlteration = {
			create: [],
			update: [],
			drop: Object.keys(existing).filter((name) => !plannedNames.has(name)),
		};

		for (const column of table.columns) {
			const existingColumn = columns[column.name];

			if (!existingColumn) {
				alteration.create.push(column);
				continue;
			}

			if (column.kind !== 'mirror' || column.type.toLowerCase() === getColumnType(existingColumn).toLowerCase())
				continue;

			alteration.update.push({ column, existing: existingColumn });
		}

		if (alteration.create.length || alteration.update.length || alteration.drop.length) {
			changes.update[table.table] = alteration;
		}
	}

	return changes;
}

function diffForeignKeys(spec: VersionTables, changes: TableChanges, existingForeignKeys: ForeignKey[]) {
	const drop: Record<string, ForeignKey[]> = {};
	const kept = new Set<VersionTableForeignKey>();

	for (const foreignKey of existingForeignKeys) {
		const alteration = changes.update[foreignKey.table];

		const match = spec[foreignKey.table]?.foreignKeys.find(
			(planned) => !kept.has(planned) && isSameForeignKey(foreignKey, planned),
		);

		const mustDrop =
			!match ||
			// if the column changes, most DBs dont allow changes unless the fk is removed.
			alteration?.update.some(({ column }) => column.name === foreignKey.column);

		if (mustDrop) {
			(drop[foreignKey.table] ??= []).push(foreignKey);
		} else {
			kept.add(match);
		}
	}

	const create: Record<string, VersionTableForeignKey[]> = {};

	for (const table of Object.values(spec)) {
		const missing = table.foreignKeys.filter((foreignKey) => !kept.has(foreignKey));

		if (missing.length > 0) create[table.table] = missing;
	}

	return { drop, create };
}

type PlanContext = { versioned: Set<string>; helper: VersioningHelper };

function getPrimaryKeyColumn(collection: LiveCollection) {
	return collection.columns.find((column) => column.is_primary_key);
}

function buildShadowTable(liveCollection: LiveCollection, context: PlanContext): VersionTable {
	const { collection, columns, relations } = liveCollection;
	const primary = getPrimaryKeyColumn(liveCollection)?.name;

	const shadow: VersionTable = {
		table: context.helper.getShadowTableName(collection),
		type: 'shadow',
		columns: Object.values(VERSION_SYSTEM_FIELDS).map((name) => ({ kind: 'system', name })),
		foreignKeys: [
			{
				column: VERSION_SYSTEM_FIELDS.userCreated,
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
				on_delete: 'SET NULL',
				on_update: null,
			},
			{
				column: VERSION_SYSTEM_FIELDS.userUpdated,
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
				on_delete: 'SET NULL',
				on_update: null,
			},
		],
	};

	for (const column of columns) {
		const field = column.name;
		// Field creation only checks this while the collection is versioned, not for fields that existed before
		assertVersionSystemField(collection, field);

		shadow.columns.push(buildMirrorColumn(column));

		// Dont create a relation for the mirrored primary key so archiving works
		if (field === primary) continue;

		const relation = relations.find((relation) => relation.field === field);

		if (!relation) continue;

		const reference = buildVersionReference(relation, context);

		// Only database o2m fk constrains are mirrored
		if (relation.schema && reference.related_collection) {
			shadow.foreignKeys.push({
				column: field,
				foreign_key_table: reference.related_collection,
				foreign_key_column: relation.schema.foreign_key_column,
				on_delete: relation.schema.on_delete,
				on_update: relation.schema.on_update ?? null,
			});
		}

		if (!reference.versioned) continue;

		const referenceField = context.helper.getVersionReferenceField(field);

		shadow.columns.push({ kind: 'reference', name: referenceField });

		if (reference.foreign_key) {
			shadow.foreignKeys.push({ ...reference.foreign_key, column: referenceField });
		}
	}

	shadow.foreignKeys = context.helper.adjustForeignKeyActions(shadow.table, shadow.foreignKeys);

	return shadow;
}

/**
 * Link tables store references from live items to versions of related collections.
 */
function buildLinkTable(collection: LiveCollection, primaryKeyColumn: Column, context: PlanContext): VersionTable {
	const primary = primaryKeyColumn.name;

	const link: VersionTable = {
		table: context.helper.getLinkTableName(collection.collection),
		type: 'link',
		columns: [buildMirrorColumn(primaryKeyColumn, true)],
		foreignKeys: [
			{
				column: primary,
				foreign_key_table: collection.collection,
				foreign_key_column: primary,
				on_delete: 'CASCADE',
				on_update: null,
			},
		],
	};

	for (const relation of collection.relations) {
		if (relation.field === primary) continue;

		const reference = buildVersionReference(relation, context);

		if (!reference.versioned) continue;

		const referenceField = context.helper.getVersionReferenceField(relation.field);

		link.columns.push({ kind: 'reference', name: referenceField });

		if (reference.foreign_key) {
			link.foreignKeys.push({ ...reference.foreign_key, column: referenceField });
		}
	}

	link.foreignKeys = context.helper.adjustForeignKeyActions(link.table, link.foreignKeys);

	return link;
}

/**
 * Figure out if a m2o / a2o relation can point to a version and how that reference should be constrained.
 */
function buildVersionReference(relation: Relation, context: PlanContext) {
	const related_collection = relation.related_collection;

	if (related_collection) {
		if (!context.versioned.has(related_collection)) {
			return { related_collection, versioned: false };
		}

		return {
			related_collection,
			versioned: true,
			foreign_key: {
				foreign_key_table: context.helper.getShadowTableName(related_collection),
				foreign_key_column: VERSION_SYSTEM_FIELDS.id,
				on_delete: relation.schema?.on_delete ?? 'SET NULL',
				on_update: null,
			},
		};
	}

	// a2o relations can't have a foreign key, as the related collection is stored in a separate field
	const allowedCollections = relation.meta?.one_allowed_collections ?? [];

	return {
		related_collection: null,
		versioned: allowedCollections.some((allowedCollection) => context.versioned.has(allowedCollection)),
		foreign_key: null,
	};
}

// Mirrored columns drop all constraints apart from relations
function buildMirrorColumn(source: Column, primary?: boolean): MirrorColumn {
	return { kind: 'mirror', name: source.name, source, type: getColumnType(source), ...(primary && { primary }) };
}

function getColumnType(column: Column): string {
	return column.full_data_type ?? column.data_type;
}

function isSameForeignKey(existing: ForeignKey, planned: VersionTableForeignKey) {
	return (
		existing.column === planned.column &&
		existing.foreign_key_table === planned.foreign_key_table &&
		existing.foreign_key_column === planned.foreign_key_column &&
		normalizeAction(existing.on_delete) === normalizeAction(planned.on_delete) &&
		normalizeAction(existing.on_update) === normalizeAction(planned.on_update)
	);
}
