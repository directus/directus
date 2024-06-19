import { useEnv } from '@directus/env';
import type { Item, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { clone, isArray } from 'lodash-es';
import type { NestedCollectionNode } from '../../../types/ast.js';

export function mergeWithParentItems(
	schema: SchemaOverview,
	nestedItem: Item | Item[],
	parentItem: Item | Item[],
	nestedNode: NestedCollectionNode,
	fieldAllowed: boolean | boolean[],
) {
	const env = useEnv();
	const nestedItems = toArray(nestedItem);
	const parentItems = clone(toArray(parentItem));

	if (nestedNode.type === 'm2o') {
		for (const parentItem of parentItems) {
			const itemChild = nestedItems.find((nestedItem) => {
				return (
					nestedItem[schema.collections[nestedNode.relation.related_collection!]!.primary] ==
					parentItem[nestedNode.relation.field]
				);
			});

			parentItem[nestedNode.fieldKey] = itemChild || null;
		}
	} else if (nestedNode.type === 'o2m') {
		for (const [index, parentItem] of parentItems.entries()) {
			if (fieldAllowed === false || (isArray(fieldAllowed) && !fieldAllowed[index])) {
				parentItem[nestedNode.fieldKey] = null;
				continue;
			}

			if (!parentItem[nestedNode.fieldKey]) parentItem[nestedNode.fieldKey] = [] as Item[];

			const itemChildren = nestedItems.filter((nestedItem) => {
				if (nestedItem === null) return false;
				if (Array.isArray(nestedItem[nestedNode.relation.field])) return true;

				return (
					nestedItem[nestedNode.relation.field] ==
						parentItem[schema.collections[nestedNode.relation.related_collection!]!.primary] ||
					nestedItem[nestedNode.relation.field]?.[
						schema.collections[nestedNode.relation.related_collection!]!.primary
					] == parentItem[schema.collections[nestedNode.relation.related_collection!]!.primary]
				);
			});

			parentItem[nestedNode.fieldKey].push(...itemChildren);

			const limit = nestedNode.query.limit ?? Number(env['QUERY_LIMIT_DEFAULT']);

			if (nestedNode.query.page && nestedNode.query.page > 1) {
				parentItem[nestedNode.fieldKey] = parentItem[nestedNode.fieldKey].slice(limit * (nestedNode.query.page - 1));
			}

			if (nestedNode.query.offset && nestedNode.query.offset >= 0) {
				parentItem[nestedNode.fieldKey] = parentItem[nestedNode.fieldKey].slice(nestedNode.query.offset);
			}

			if (limit !== -1) {
				parentItem[nestedNode.fieldKey] = parentItem[nestedNode.fieldKey].slice(0, limit);
			}

			parentItem[nestedNode.fieldKey] = parentItem[nestedNode.fieldKey].sort((a: Item, b: Item) => {
				// This is pre-filled in get-ast-from-query
				const sortField = nestedNode.query.sort![0]!;
				let column = sortField;
				let order: 'asc' | 'desc' = 'asc';

				if (sortField.startsWith('-')) {
					column = sortField.substring(1);
					order = 'desc';
				}

				if (a[column] === b[column]) return 0;
				if (a[column] === null) return 1;
				if (b[column] === null) return -1;

				if (order === 'asc') {
					return a[column] < b[column] ? -1 : 1;
				} else {
					return a[column] < b[column] ? 1 : -1;
				}
			});
		}
	} else if (nestedNode.type === 'a2o') {
		for (const parentItem of parentItems) {
			if (!nestedNode.relation.meta?.one_collection_field) {
				parentItem[nestedNode.fieldKey] = null;
				continue;
			}

			const relatedCollection = parentItem[nestedNode.relation.meta.one_collection_field];

			if (!(nestedItem as Record<string, any[]>)[relatedCollection]) {
				parentItem[nestedNode.fieldKey] = null;
				continue;
			}

			const itemChild = (nestedItem as Record<string, any[]>)[relatedCollection]!.find((nestedItem) => {
				return nestedItem[nestedNode.relatedKey[relatedCollection]!] == parentItem[nestedNode.fieldKey];
			});

			parentItem[nestedNode.fieldKey] = itemChild || null;
		}
	}

	return Array.isArray(parentItem) ? parentItems : parentItems[0];
}
