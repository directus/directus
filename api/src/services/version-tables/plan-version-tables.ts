import { InvalidPayloadError } from '@directus/errors';
import type { Column, ForeignKey } from '@directus/schema';
import type { Relation } from '@directus/types';
import {
	getLinkTableName,
	getShadowTableName,
	getVersionReferenceField,
	isVersionTable,
	VERSION_META_FIELDS,
} from './constants.js';

export type OnDelete = ForeignKey['on_delete'];

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
	on_delete: OnDelete;
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

/**
 * Compute the shadow and link tables that should exist for the given live collections. Only the version tables of
 * these collections are planned, the version tables of any other collection are left out.
 *
 * @param collections - Live collections to plan the version tables for
 * @param versioned - All collections that have versioning enabled, including ones not being planned
 */
export function planVersionTables(collections: LiveCollection[], versioned: Set<string>): VersionTable[] {
	const tables: VersionTable[] = [];

	for (const collection of collections) {
		if (!versioned.has(collection.collection) || isVersionTable(collection.collection)) continue;

		tables.push(planShadowTable(collection, versioned));
	}

	for (const collection of collections) {
		if (isVersionTable(collection.collection)) continue;

		const linkTable = planLinkTable(collection, versioned);

		if (linkTable) tables.push(linkTable);
	}

	return tables;
}

function getPrimaryKey(collection: LiveCollection) {
	return collection.columns.find((column) => column.is_primary_key);
}

function planShadowTable(liveCollection: LiveCollection, versioned: Set<string>): VersionTable {
	const { collection, columns, relations } = liveCollection;
	const primary = getPrimaryKey(liveCollection)?.name;
	const metaFields: string[] = Object.values(VERSION_META_FIELDS);

	const shadow: VersionTable = {
		table: getShadowTableName(collection),
		type: 'shadow',
		columns: metaFields.map((name) => ({ kind: 'meta', name })),
		foreignKeys: [
			{
				column: VERSION_META_FIELDS.userCreated,
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
				on_delete: 'SET NULL',
			},
			{
				column: VERSION_META_FIELDS.userUpdated,
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
				on_delete: 'SET NULL',
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

		const reference = getVersionReference(relation, versioned);

		// Relational constraints are the only constraints that are kept on the mirrored columns
		if (relation.schema && reference.relatedCollection) {
			shadow.foreignKeys.push({
				column: field,
				foreign_key_table: reference.relatedCollection,
				foreign_key_column: relation.schema.foreign_key_column,
				on_delete: relation.schema.on_delete,
			});
		}

		if (!reference.versioned) continue;

		const referenceField = getVersionReferenceField(field);

		reserveName(referenceField, field);
		shadow.columns.push({ kind: 'reference', name: referenceField });

		if (reference.foreignKey) {
			shadow.foreignKeys.push({ ...reference.foreignKey, column: referenceField });
		}
	}

	return shadow;
}

/**
 * Link tables store references from live items to versions of related collections, which is needed for o2m relations
 * on versioned collections without having to modify the live table.
 * Only created when at least one m2o / a2o of the collection points to a versioned collection.
 */
function planLinkTable(liveCollection: LiveCollection, versioned: Set<string>): VersionTable | null {
	const { collection, relations } = liveCollection;
	const source = getPrimaryKey(liveCollection);

	if (!source) return null;

	const primary = source.name;

	const link: VersionTable = {
		table: getLinkTableName(collection),
		type: 'link',
		columns: [{ kind: 'mirror', name: primary, source, primary: true }],
		foreignKeys: [
			{
				column: primary,
				foreign_key_table: collection,
				foreign_key_column: primary,
				on_delete: 'CASCADE',
			},
		],
	};

	for (const relation of relations) {
		if (relation.field === primary) continue;

		const reference = getVersionReference(relation, versioned);

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
function getVersionReference(relation: Relation, versioned: Set<string>) {
	const relatedCollection = relation.related_collection;

	if (relatedCollection) {
		if (!versioned.has(relatedCollection)) return { relatedCollection, versioned: false } as const;

		return {
			relatedCollection,
			versioned: true,
			foreignKey: {
				foreign_key_table: getShadowTableName(relatedCollection),
				foreign_key_column: VERSION_META_FIELDS.id,
				on_delete: relation.schema?.on_delete ?? 'SET NULL',
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
