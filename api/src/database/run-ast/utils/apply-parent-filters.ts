import type { Item, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { groupBy, isNil, merge, uniq } from 'lodash-es';
import type { NestedCollectionNode, O2MNode } from '../../../types/ast.js';
import { applyVersionedA2OParentFilter, applyVersionedParentFilter } from '../../../versioning/run.js';

/**
 * Scope each nested relational node's query to the parent items that were already fetched, so nested
 * relations are loaded in a single query per node instead of one query per parent item.
 *
 * Per relation type:
 * - `m2o`: filters the related collection by its primary key using the foreign keys stored on the parents.
 * - `o2m`: filters the related collection by its foreign key using the parents' primary keys. Also ensures the
 *   foreign key field (and the sort field, if configured) is selected so the results can be mapped back.
 * - `a2o`: groups the parents' foreign keys by the collection named in the `one_collection_field` and adds a
 *   filter and limit per related collection.
 *
 * Nodes (or a2o collections) with versioning enabled are delegated to the versioning helpers instead.
 *
 * Mutates the given nodes in place.
 *
 * @param schema - The schema overview used to resolve primary keys
 * @param nestedCollectionNodes - The nested relational nodes of the current AST level
 * @param parentItem - The already fetched parent item(s)
 * @returns The same, mutated, nested collection nodes
 */
export function applyParentFilters(
	schema: SchemaOverview,
	nestedCollectionNodes: NestedCollectionNode[],
	parentItem: Item | Item[],
) {
	const parentItems = toArray(parentItem);

	for (const nestedNode of nestedCollectionNodes) {
		if (!nestedNode.relation) continue;

		if (nestedNode.type === 'a2o') {
			applyVersionedA2OParentFilter(nestedNode, parentItems, schema);

			const parentsPerCollection = groupBy(parentItems, nestedNode.relation.meta!.one_collection_field!);

			for (const relatedCollection of nestedNode.names) {
				if (nestedNode.versioning?.[relatedCollection]) continue;

				const foreignField = nestedNode.relatedKey[relatedCollection]!;
				const foreignIds = uniqueKeys(parentsPerCollection[relatedCollection] ?? [], nestedNode.relation.field);

				merge(nestedNode, {
					query: { [relatedCollection]: { filter: { [foreignField]: { _in: foreignIds } }, limit: foreignIds.length } },
				});
			}

			continue;
		}

		if (nestedNode.type === 'o2m') {
			ensureField(nestedNode, nestedNode.relation.field);
			if (nestedNode.relation.meta?.sort_field) ensureField(nestedNode, nestedNode.relation.meta.sort_field);
		}

		if (nestedNode.versioning) {
			applyVersionedParentFilter({ ...nestedNode, versioning: nestedNode.versioning }, parentItems, schema);
			continue;
		}

		const [foreignField, parentField] =
			nestedNode.type === 'm2o'
				? [schema.collections[nestedNode.relation.related_collection!]!.primary, nestedNode.relation.field]
				: [nestedNode.relation.field, nestedNode.parentKey];

		merge(nestedNode, { query: { filter: { [foreignField]: { _in: uniqueKeys(parentItems, parentField) } } } });
	}

	return nestedCollectionNodes;
}

function uniqueKeys(items: Item[], field: string) {
	return uniq(items.map((item) => item[field])).filter((key) => !isNil(key));
}

function ensureField(node: O2MNode, field: string) {
	if (node.children.some((child) => child.type === 'field' && child.name === field)) return;
	node.children.push({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false });
}
