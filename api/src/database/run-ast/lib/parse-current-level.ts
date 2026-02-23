import type { Query, SchemaOverview } from '@directus/types';
import { isVersionedCollection } from '../../../services/versions/is-versioned-collection.js';
import { isVersionedRelation } from '../../../services/versions/is-versioned-relation.js';
import { toVersionNode } from '../../../services/versions/to-version-node.js';
import { toVersionedCollectionName } from '../../../services/versions/to-versioned-collection-name.js';
import { toVersionedRelationName } from '../../../services/versions/to-versioned-relation-name.js';
import { VERSION_SYSTEM_FIELDS } from '../../../services/versions/version-system-fields.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../types/ast.js';
import { parseFilterKey } from '../../../utils/parse-filter-key.js';

/**
 * Parses a single level of the AST create selection nodes for the query.
 * Injects any required fields (e.g. Primary Key) if they are not selected.
 *
 * For versioned collections, additional version nodes are injected alongside the original relation.
 *
 * @param schema
 * @param collection - The collection being queried at this level.
 * @param children - Child AST nodes
 * @param query - Any applicable query parameters for this level (e.g. filters, aggregates, groups).
 */
export async function parseCurrentLevel(
	schema: SchemaOverview,
	collection: string,
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
	query: Query,
) {
	const primaryKeyField = schema.collections[collection]!.primary;
	const columnsInCollection = Object.keys(schema.collections[collection]!.fields);

	const columnsToSelectInternal: string[] = [];
	const nestedCollectionNodes: NestedCollectionNode[] = [];

	for (const child of children) {
		if (child.type === 'field' || child.type === 'functionField') {
			const { fieldName } = parseFilterKey(child.name);

			if (columnsInCollection.includes(fieldName)) {
				columnsToSelectInternal.push(child.fieldKey);
			}

			// Since M2O fields can also be a top-level selection, we need to check and add a version equivalent field.
			if (isVersionedCollection(collection)) {
				const relation = schema.relations.find(
					(r) =>
						toVersionedCollectionName(r.collection) === collection &&
						r.field === toVersionedRelationName(child.fieldKey),
				);

				if (relation && relation.related_collection && schema.collections[relation.related_collection]?.versioning) {
					columnsToSelectInternal.push(toVersionedRelationName(child.fieldKey));
				}
			}

			continue;
		}

		if (!child.relation) continue;

		if (child.type === 'm2o') {
			if (isVersionedRelation(child.relation.field)) {
				continue;
			}

			columnsToSelectInternal.push(child.relation.field);

			if (isVersionedCollection(collection) && schema.collections[child.relation.related_collection!]?.versioning) {
				const versionNode = toVersionNode(child);

				columnsToSelectInternal.push(versionNode.relation.field);
				nestedCollectionNodes.push(versionNode);
			}
		}

		if (child.type === 'a2o') {
			if (isVersionedRelation(child.relation.field)) {
				continue;
			}

			columnsToSelectInternal.push(child.relation.field);
			columnsToSelectInternal.push(child.relation.meta!.one_collection_field!);

			if (isVersionedCollection(collection) && schema.collections[child.relation.meta!.many_collection]?.versioning) {
				const versionNode = toVersionNode(child);

				columnsToSelectInternal.push(versionNode.relation.field);
				columnsToSelectInternal.push(versionNode.relation.meta!.one_collection_field!);
				nestedCollectionNodes.push(versionNode);
			}
		}

		nestedCollectionNodes.push(child);
	}

	if (isVersionedCollection(collection)) {
		// inject version fields for "meta"
		Object.values(VERSION_SYSTEM_FIELDS).forEach((f) => {
			columnsToSelectInternal.push(f.field);
		});
	}

	const isAggregate = (query.group || (query.aggregate && Object.keys(query.aggregate).length > 0)) ?? false;

	/** Always fetch primary key in case there's a nested relation that needs it. Aggregate payloads
	 * can't have nested relational fields
	 */
	if (isAggregate === false && columnsToSelectInternal.includes(primaryKeyField) === false) {
		columnsToSelectInternal.push(primaryKeyField);
	}

	/** Make sure select list has unique values */
	const columnsToSelect = [...new Set(columnsToSelectInternal)];

	const fieldNodes = columnsToSelect.map(
		(column: string) =>
			children.find(
				(childNode) =>
					(childNode.type === 'field' || childNode.type === 'functionField') && childNode.fieldKey === column,
			) ?? {
				type: 'field',
				name: column,
				fieldKey: column,
			},
	) as FieldNode[];

	return { fieldNodes, nestedCollectionNodes, primaryKeyField };
}
