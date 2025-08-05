import type { Item, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { cloneDeep, pick } from 'lodash-es';
import type { AST, NestedCollectionNode } from '../../../types/ast.js';
import { applyFunctionToColumnName } from './apply-function-to-column-name.js';

export function removeTemporaryFields(
	schema: SchemaOverview,
	rawItem: Item | Item[],
	ast: AST | NestedCollectionNode,
	primaryKeyField: string,
	parentItem?: Item,
): null | Item | Item[] {
	const rawItems = cloneDeep(toArray(rawItem));
	const items: Item[] = [];

	if (ast.type === 'a2o') {
		const fields: Record<string, string[]> = {};
		const nestedCollectionNodes: Record<string, NestedCollectionNode[]> = {};

		for (const relatedCollection of ast.names) {
			if (!fields[relatedCollection]) fields[relatedCollection] = [];
			if (!nestedCollectionNodes[relatedCollection]) nestedCollectionNodes[relatedCollection] = [];

			for (const child of ast.children[relatedCollection]!) {
				if (child.type === 'field' || child.type === 'functionField') {
					fields[relatedCollection]!.push(child.name);
				} else {
					fields[relatedCollection]!.push(child.fieldKey);
					nestedCollectionNodes[relatedCollection]!.push(child);
				}
			}
		}

		for (const rawItem of rawItems) {
			const relatedCollection: string = parentItem?.[ast.relation.meta!.one_collection_field!];

			if (rawItem === null || rawItem === undefined) return rawItem;

			let item = rawItem;

			for (const nestedNode of nestedCollectionNodes[relatedCollection]!) {
				item[nestedNode.fieldKey] = removeTemporaryFields(
					schema,
					item[nestedNode.fieldKey],
					nestedNode,
					schema.collections[nestedNode.relation.collection]!.primary,
					item,
				);
			}

			const fieldsWithFunctionsApplied = fields[relatedCollection]!.map((field) => applyFunctionToColumnName(field));

			item =
				fields[relatedCollection]!.length > 0 ? pick(rawItem, fieldsWithFunctionsApplied) : rawItem[primaryKeyField];

			items.push(item);
		}
	} else {
		const fields: string[] = [];
		const aliasFields: string[] = [];
		const nestedCollectionNodes: NestedCollectionNode[] = [];

		for (const child of ast.children) {
			if ('alias' in child && child.alias === true) {
				aliasFields.push(child.fieldKey);
			} else {
				fields.push(child.fieldKey);
			}

			if (child.type !== 'field' && child.type !== 'functionField') {
				nestedCollectionNodes.push(child);
			}
		}

		// Make sure any requested aggregate fields are included
		if (ast.query?.aggregate) {
			for (const [operation, aggregateFields] of Object.entries(ast.query.aggregate)) {
				if (!fields) continue;

				if (operation === 'count' && aggregateFields.includes('*')) fields.push('count');

				fields.push(...aggregateFields.map((field) => `${operation}.${field}`));
			}
		}

		for (const rawItem of rawItems) {
			if (rawItem === null || rawItem === undefined) return rawItem;

			let item = rawItem;

			for (const nestedNode of nestedCollectionNodes) {
				item[nestedNode.fieldKey] = removeTemporaryFields(
					schema,
					item[nestedNode.fieldKey],
					nestedNode,
					nestedNode.type === 'm2o'
						? schema.collections[nestedNode.relation.related_collection!]!.primary
						: schema.collections[nestedNode.relation.collection]!.primary,
					item,
				);
			}

			const fieldsWithFunctionsApplied = fields.map((field) => applyFunctionToColumnName(field));

			item = fields.length > 0 ? pick(rawItem, fieldsWithFunctionsApplied, aliasFields) : rawItem[primaryKeyField];

			items.push(item);
		}
	}

	return Array.isArray(rawItem) ? items : items[0]!;
}
