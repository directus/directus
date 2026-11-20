import type { Column, ForeignKey } from '@directus/schema';
import type { Relation } from '@directus/types';
import { partition } from 'lodash-es';
import type { VersioningHelper } from '../../database/helpers/versioning/types.js';
import type { InspectedSchema } from '../version-tables.js';
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
export type ColumnsByTable = Record<string, Record<string, Column>>;

export type InspectedTables = {
	columns: ColumnsByTable;
	foreignKeys: ForeignKey[];
};

export type TableAlteration = {
	add: VersionTableColumn[];
	alter: { column: MirrorColumn; existing: Column }[];
	drop: string[];
};

export type TableChanges = {
	drop: string[];
	create: VersionTable[];
	alter: Record<string, TableAlteration>;
};

export type Plan = {
	dropTables: string[];
	createTables: VersionTable[];
	alterTables: Record<string, TableAlteration>;
	foreignKeys: { drop: ForeignKey[]; add: Record<string, VersionTableForeignKey[]> };
};

/**
 * Plan the changes to the version tables of the given live collections. Only the version tables of these collections
 * are planned, so `existing` is expected to hold just their version tables: any other table in it is dropped.
 *
 * @param schema - Inspected Schema
 * @param helper - Provides the vendor specific names and foreign key rules of the version tables
 */
export function planVersioning(schema: InspectedSchema, helper: VersioningHelper): Plan {
	const { liveCollections, shadowTables, versionedTables } = schema;

	const target = generateVersionTables(liveCollections, { versioned: versionedTables, helper });
	const changes = calculateChanges(target, shadowTables.columns);
	const foreignKeys = planForeignKeyChanges(target, changes, shadowTables.foreignKeys);

	return { alterTables: changes.alter, createTables: changes.create, dropTables: changes.drop, foreignKeys };
}

/**
 * Compute the shadow and link tables that should exist for the given live collections
 */
function generateVersionTables(collections: LiveCollections, context: PlanContext): VersionTables {
	const tables: VersionTables = {};

	for (const collection of Object.values(collections)) {
		if (!context.versioned.has(collection.collection) || isVersioningTable(collection.collection)) continue;

		const shadowTable = planShadowTable(collection, context);

		tables[shadowTable.table] = shadowTable;
	}

	for (const collection of Object.values(collections)) {
		if (isVersioningTable(collection.collection)) continue;

		const linkTable = planLinkTable(collection, context);

		if (linkTable) tables[linkTable.table] = linkTable;
	}

	return context.helper.applyForeignKeyRules(tables);
}

/**
 * Diff the target tables against the existing ones
 */
function calculateChanges(target: VersionTables, existingColumns: ColumnsByTable): TableChanges {
	const changes: TableChanges = {
		drop: Object.keys(existingColumns).filter((table) => !target[table]),
		create: Object.values(target).filter((table) => !existingColumns[table.table]),
		alter: {},
	};

	for (const table of Object.values(target)) {
		const existing = existingColumns[table.table];

		if (!existing) continue;

		const plannedNames = new Set(table.columns.map((column) => column.name));

		const alteration: TableAlteration = {
			add: table.columns.filter((column) => !existing[column.name]),
			alter: table.columns.flatMap((column) => {
				const current = existing[column.name];

				if (!current || column.kind !== 'mirror') return [];
				if (column.type.toLowerCase() === getType(current).toLowerCase()) return [];

				return [{ column, existing: current }];
			}),
			drop: Object.keys(existing).filter((name) => !plannedNames.has(name)),
		};

		if (alteration.add.length || alteration.alter.length || alteration.drop.length) {
			changes.alter[table.table] = alteration;
		}
	}

	return changes;
}

function planForeignKeyChanges(target: VersionTables, changes: TableChanges, foreignKeys: ForeignKey[]) {
	const [drop, kept] = partition(foreignKeys, (foreignKey: ForeignKey) => {
		const table = target[foreignKey.table];
		const alteration = changes.alter[foreignKey.table];

		if (!table) return true;
		if (alteration?.drop.includes(foreignKey.column)) return true;
		if (alteration?.alter.some(({ column }) => column.name === foreignKey.column)) return true;

		return !table.foreignKeys.some((planned) => isSameForeignKey(foreignKey, planned));
	});

	const add: Record<string, VersionTableForeignKey[]> = {};

	for (const table of Object.values(target)) {
		const missing = table.foreignKeys.filter(
			(foreignKey) => !kept.some((kept) => kept.table === table.table && isSameForeignKey(kept, foreignKey)),
		);

		if (missing.length > 0) add[table.table] = missing;
	}

	return { drop, add };
}

type PlanContext = { versioned: Set<string>; helper: VersioningHelper };

function getPrimaryKey(collection: LiveCollection) {
	return collection.columns.find((column) => column.is_primary_key);
}

function planShadowTable(liveCollection: LiveCollection, context: PlanContext): VersionTable {
	const { collection, columns, relations } = liveCollection;
	const primary = getPrimaryKey(liveCollection)?.name;

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

	// Field creation only checks this while the collection is versioned, not for fields that existed before
	for (const column of columns) {
		assertVersionSystemField(collection, column.name);
	}

	for (const source of columns) {
		const field = source.name;

		shadow.columns.push(mirrorColumn(source));

		// The live primary key references the live item and is null until the version is published. It has no foreign
		// key, so archived versions keep the id of their item after the live item is removed
		if (field === primary) continue;

		const relation = relations.find((relation) => relation.field === field);

		if (!relation) continue;

		const reference = getVersionReference(relation, context);

		// Relational constraints are the only constraints that are kept on the mirrored columns
		if (relation.schema && reference.relatedCollection) {
			shadow.foreignKeys.push({
				column: field,
				foreign_key_table: reference.relatedCollection,
				foreign_key_column: relation.schema.foreign_key_column,
				on_delete: relation.schema.on_delete,
				on_update: relation.schema.on_update ?? null,
			});
		}

		if (!reference.versioned) continue;

		const referenceField = context.helper.getVersionReferenceField(field);

		shadow.columns.push({ kind: 'reference', name: referenceField });

		if (reference.foreignKey) {
			shadow.foreignKeys.push({ ...reference.foreignKey, column: referenceField });
		}
	}

	return shadow;
}

/**
 * Link tables store references from live items to versions of related collections.
 * Only created when a versioned collection has an o2m to the collection.
 */
function planLinkTable(liveCollection: LiveCollection, context: PlanContext): VersionTable | null {
	const { collection, relations } = liveCollection;
	const source = getPrimaryKey(liveCollection);

	if (!source) return null;

	const hasVersionedO2M = relations.some(
		(relation) =>
			relation.field !== source.name &&
			relation.meta?.one_field &&
			relation.related_collection &&
			context.versioned.has(relation.related_collection),
	);

	if (!hasVersionedO2M) return null;

	const primary = source.name;

	const link: VersionTable = {
		table: context.helper.getLinkTableName(collection),
		type: 'link',
		columns: [mirrorColumn(source, true)],
		foreignKeys: [
			{
				column: primary,
				foreign_key_table: collection,
				foreign_key_column: primary,
				on_delete: 'CASCADE',
				on_update: null,
			},
		],
	};

	for (const relation of relations) {
		if (relation.field === primary) continue;

		const reference = getVersionReference(relation, context);

		if (!reference.versioned) continue;

		link.columns.push({ kind: 'reference', name: relation.field });

		if (reference.foreignKey) {
			link.foreignKeys.push({ ...reference.foreignKey, column: relation.field });
		}
	}

	return link.columns.length > 1 ? link : null;
}

/**
 * Figure out if a m2o / a2o relation can point to a version and how that reference should be constrained.
 * Relations to collections that no longer exist are expected to be left out by the caller.
 */
function getVersionReference(relation: Relation, { versioned, helper }: PlanContext) {
	const relatedCollection = relation.related_collection;

	if (relatedCollection) {
		if (!versioned.has(relatedCollection)) return { relatedCollection, versioned: false } as const;

		return {
			relatedCollection,
			versioned: true,
			foreignKey: {
				foreign_key_table: helper.getShadowTableName(relatedCollection),
				foreign_key_column: VERSION_SYSTEM_FIELDS.id,
				on_delete: relation.schema?.on_delete ?? 'SET NULL',
				on_update: null,
			},
		} as const;
	}

	// a2o relations can't have a foreign key, as the related collection is stored in a separate field
	const allowedCollections = relation.meta?.one_allowed_collections ?? [];

	return {
		relatedCollection: null,
		versioned: allowedCollections.some((allowedCollection) => versioned.has(allowedCollection)),
		foreignKey: null,
	} as const;
}

// Mirrored columns drop all constraints apart from relations
function mirrorColumn(source: Column, primary?: boolean): MirrorColumn {
	return { kind: 'mirror', name: source.name, source, type: getType(source), ...(primary && { primary }) };
}

function getType(column: Column): string {
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
