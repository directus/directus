import { InvalidPayloadError } from '@directus/errors';
import type { Column, ForeignKey } from '@directus/schema';
import type { Relation } from '@directus/types';
import type { VersioningHelper } from '../../database/helpers/versioning/types.js';
import { VERSION_SYSTEM_FIELDS } from './constants.js';
import { isVersioningTable } from './utils.js';

export type ReferentialAction = ForeignKey['on_delete'];

/** Vendors report the default action differently, but they all behave the same */
export function normalizeAction(action: ReferentialAction) {
	return action === null || action === 'RESTRICT' ? 'NO ACTION' : action;
}

export type VersionTableColumn =
	/** One of the version meta fields, only present on shadow tables */
	| { kind: 'meta'; name: string }
	/** Copy of a live column, without any of its constraints */
	| { kind: 'mirror'; name: string; source: Column; primary?: boolean }
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
	/** Columns of the live table, in table order */
	columns: Column[];
	/** m2o and a2o relations where this collection is the "many" side */
	relations: Relation[];
};

/** Version tables keyed by table name */
export type VersionTables = Record<string, VersionTable>;

/** Live collections keyed by collection name */
export type LiveCollections = Record<string, LiveCollection>;

/**
 * Compute the shadow and link tables that should exist for the given live collections. Only the version tables of
 * these collections are planned, the version tables of any other collection are left out.
 *
 * @param collections - Live collections to plan the version tables for, keyed by collection name
 * @param versioned - All collections that have versioning enabled, including ones not being planned
 * @param helper - Provides the vendor specific names of the version tables and their columns
 */
export function planVersionTables(
	collections: LiveCollections,
	versioned: Set<string>,
	helper: VersioningHelper,
): VersionTables {
	const context: PlanContext = { versioned, helper };
	const tables: VersionTables = {};

	for (const collection of Object.values(collections)) {
		if (!versioned.has(collection.collection) || isVersioningTable(collection.collection)) continue;

		const shadowTable = planShadowTable(collection, context);

		tables[shadowTable.table] = shadowTable;
	}

	for (const collection of Object.values(collections)) {
		if (isVersioningTable(collection.collection)) continue;

		const linkTable = planLinkTable(collection, context);

		if (linkTable) tables[linkTable.table] = linkTable;
	}

	return tables;
}

type PlanContext = { versioned: Set<string>; helper: VersioningHelper };

function getPrimaryKey(collection: LiveCollection) {
	return collection.columns.find((column) => column.is_primary_key);
}

function planShadowTable(liveCollection: LiveCollection, context: PlanContext): VersionTable {
	const { collection, columns, relations } = liveCollection;
	const primary = getPrimaryKey(liveCollection)?.name;
	const metaFields: string[] = Object.values(VERSION_SYSTEM_FIELDS);

	const shadow: VersionTable = {
		table: context.helper.getShadowTableName(collection),
		type: 'shadow',
		columns: metaFields.map((name) => ({ kind: 'meta', name })),
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

	const usedNames = new Set(metaFields);

	const reserveName = (name: string, field: string) => {
		if (usedNames.has(name)) {
			throw new InvalidPayloadError({
				reason: `Field "${field}" in collection "${collection}" conflicts with the versioning field "${name}"`,
			});
		}

		usedNames.add(name);
	};

	for (const source of columns) {
		const field = source.name;

		reserveName(field, field);
		shadow.columns.push({ kind: 'mirror', name: field, source });

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

		reserveName(referenceField, field);
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
		columns: [{ kind: 'mirror', name: primary, source, primary: true }],
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
