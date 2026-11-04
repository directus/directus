import { InvalidPayloadError } from '@directus/errors';
import type { Column, ForeignKey } from '@directus/schema';
import type { Relation, SchemaOverview } from '@directus/types';
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
 * Compute the shadow and link tables that should exist for the given schema.
 *
 * @param schema - Schema of the live tables, any version tables in it are ignored
 * @param versioned - Collections that have versioning enabled
 * @param columns - Column info of the live tables, keyed by table and column name
 */
export function planVersionTables(
	schema: SchemaOverview,
	versioned: Set<string>,
	columns: Record<string, Record<string, Column>>,
): VersionTable[] {
	const relations = schema.relations.filter((relation) => !isVersionTable(relation.collection));
	const tables: VersionTable[] = [];

	for (const collection of versioned) {
		if (!schema.collections[collection]) continue;

		tables.push(planShadowTable(collection, schema, versioned, relations, columns));
	}

	for (const collection of Object.keys(schema.collections)) {
		if (isVersionTable(collection)) continue;

		const linkTable = planLinkTable(collection, schema, versioned, relations, columns);

		if (linkTable) tables.push(linkTable);
	}

	return tables;
}

function planShadowTable(
	collection: string,
	schema: SchemaOverview,
	versioned: Set<string>,
	relations: Relation[],
	columns: Record<string, Record<string, Column>>,
): VersionTable {
	const { primary, fields } = schema.collections[collection]!;
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

	for (const field of Object.values(fields)) {
		const source = columns[collection]?.[field.field];

		if (field.alias || !source) continue;

		reserveName(field.field, field.field);
		shadow.columns.push({ kind: 'mirror', name: field.field, source });

		// The live primary key references the live item and is null until the version is published. It has no foreign
		// key, so archived versions keep the id of their item after the live item is removed
		if (field.field === primary) continue;

		const relation = relations.find((relation) => relation.collection === collection && relation.field === field.field);

		if (!relation) continue;

		const reference = getVersionReference(relation, schema, versioned);

		// Relational constraints are the only constraints that are kept on the mirrored columns
		if (relation.schema && reference.relatedCollection) {
			shadow.foreignKeys.push({
				column: field.field,
				foreign_key_table: reference.relatedCollection,
				foreign_key_column: schema.collections[reference.relatedCollection]!.primary,
				on_delete: relation.schema.on_delete,
			});
		}

		if (!reference.versioned) continue;

		const referenceField = getVersionReferenceField(field.field);

		reserveName(referenceField, field.field);
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
function planLinkTable(
	collection: string,
	schema: SchemaOverview,
	versioned: Set<string>,
	relations: Relation[],
	columns: Record<string, Record<string, Column>>,
): VersionTable | null {
	const { primary } = schema.collections[collection]!;
	const source = columns[collection]?.[primary];

	if (!source) return null;

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
		if (relation.collection !== collection || relation.field === primary) continue;

		const reference = getVersionReference(relation, schema, versioned);

		if (!reference.versioned) continue;

		link.columns.push({ kind: 'reference', name: relation.field });

		if (reference.foreignKey) {
			link.foreignKeys.push({ ...reference.foreignKey, column: relation.field });
		}
	}

	return link.columns.length > 1 ? link : null;
}

/**
 * Figure out if a m2o / a2o relation can point to a version and how that reference should be constrained
 */
function getVersionReference(relation: Relation, schema: SchemaOverview, versioned: Set<string>) {
	const relatedCollection =
		relation.related_collection && schema.collections[relation.related_collection] ? relation.related_collection : null;

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
