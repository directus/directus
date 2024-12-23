import { useEnv } from '@directus/env';
import type { Item, SchemaOverview, PrimaryKey } from '@directus/types';
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
		const parentsByForeignKey = new Map<PrimaryKey, Item[]>();

		parentItems.forEach((parentItem: Item) => {
			const relationKey = parentItem[nestedNode.relation.field];

			if (!parentsByForeignKey.has(relationKey)) {
				parentsByForeignKey.set(relationKey, []);
			}

			parentItem[nestedNode.fieldKey] = null;
			parentsByForeignKey.get(relationKey)!.push(parentItem);
		});

		const nestPrimaryKeyField = schema.collections[nestedNode.relation.related_collection!]!.primary;

		for (const nestedItem of nestedItems) {
			const nestedPK = nestedItem[nestPrimaryKeyField];

			for (const parentItem of parentsByForeignKey.get(nestedPK)!) {
				parentItem[nestedNode.fieldKey] = nestedItem;
			}
		}
	} else if (nestedNode.type === 'o2m') {
		const parentCollectionName = nestedNode.relation.related_collection;
		const parentPrimaryKeyField = schema.collections[parentCollectionName!]!.primary;
		const parentRelationField = nestedNode.fieldKey;
		const nestedParentKeyField = nestedNode.relation.field;

		const parentsByPrimaryKey = new Map<PrimaryKey, Item>();

		parentItems.forEach((parentItem: Item) => {
			if (!parentItem[parentRelationField]) parentItem[parentRelationField] = [];

			const parentPrimaryKey = parentItem[parentPrimaryKeyField];

			if (parentsByPrimaryKey.has(parentPrimaryKey)) {
				throw new Error(
					`Duplicate parent primary key '${parentPrimaryKey}' of '${parentCollectionName}' when merging o2m nested items`,
				);
			}

			parentsByPrimaryKey.set(parentPrimaryKey, parentItem);
		});

		const toAddToAllParents: Item[] = [];

		nestedItems.forEach((nestedItem) => {
			if (nestedItem === null) return;

			if (Array.isArray(nestedItem[nestedParentKeyField])) {
				toAddToAllParents.push(nestedItem); // TODO explain this odd case
				return; // Avoids adding the nestedItem twice
			}

			const parentPrimaryKey =
				nestedItem[nestedParentKeyField]?.[parentPrimaryKeyField] ?? nestedItem[nestedParentKeyField];

			const parentItem = parentsByPrimaryKey.get(parentPrimaryKey);

			if (!parentItem) {
				throw new Error(
					`Missing parentItem '${nestedItem[nestedParentKeyField]}' of '${parentCollectionName}' when merging o2m nested items`,
				);
			}

			parentItem[parentRelationField].push(nestedItem);
		});

		for (const [index, parentItem] of parentItems.entries()) {
			if (fieldAllowed === false || (isArray(fieldAllowed) && !fieldAllowed[index])) {
				parentItem[nestedNode.fieldKey] = null;
				continue;
			}

			parentItem[parentRelationField].push(...toAddToAllParents);

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
