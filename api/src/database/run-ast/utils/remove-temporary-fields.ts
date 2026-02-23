import type { Item, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { cloneDeep, get, pick, set, unset } from 'lodash-es';
import { isVersionedCollection } from '../../../services/versions/is-versioned-collection.js';
import { isVersionedRelation } from '../../../services/versions/is-versioned-relation.js';
import { toVersionNode } from '../../../services/versions/to-version-node.js';
import { toVersionedRelationName } from '../../../services/versions/to-versioned-relation-name.js';
import { VERSION_SYSTEM_FIELDS } from '../../../services/versions/version-system-fields.js';
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
		const versionDirectMap = new Map<string, string>();
		const versionRelationMap = new Map<string, string>();

		for (const child of ast.children) {
			if ('alias' in child && child.alias === true) {
				aliasFields.push(child.fieldKey);
			} else {
				if (ast.type === 'root' && isVersionedCollection(ast.name) && !isVersionedRelation(child.fieldKey)) {
					if (
						schema.collections[ast.name]?.fields[child.fieldKey]?.type === 'alias' ||
						schema.relations.find((r) => r.collection === ast.name && r.field === child.fieldKey)
					) {
						versionDirectMap.set(child.fieldKey, toVersionedRelationName(child.fieldKey));
					}
				}

				// dont expose top level version fields
				if (isVersionedRelation(child.fieldKey)) continue;

				fields.push(child.fieldKey);
			}

			if (child.type !== 'field' && child.type !== 'functionField') {
				const collection = child.type === 'o2m' ? child.relation.related_collection! : child.relation.collection;
				const target = child.type === 'o2m' ? child.relation.collection : child.relation.related_collection!;

				if (
					isVersionedCollection(collection) &&
					schema.collections[target]?.versioning &&
					!isVersionedRelation(child.fieldKey)
				) {
					versionRelationMap.set(child.fieldKey, toVersionedRelationName(child.fieldKey));
				}

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

			for (let nestedNode of nestedCollectionNodes) {
				const key = nestedNode.fieldKey;
				const versionKey = versionRelationMap.get(nestedNode.fieldKey);

				// Dont duplicate process versioned nodes
				if (isVersionedRelation(nestedNode.fieldKey)) {
					continue;
				}

				// Merge version node into original if its empty
				if (
					versionKey &&
					((item[key] === null && item[toVersionedRelationName(key)] !== null) ||
						(Array.isArray(item[key]) &&
							item[key].length === 0 &&
							Array.isArray(toVersionedRelationName(key)) &&
							item[toVersionedRelationName(key)].length > 0))
				) {
					nestedNode = toVersionNode(nestedNode);
				}

				item[key] = removeTemporaryFields(
					schema,
					item[nestedNode.fieldKey],
					nestedNode,
					nestedNode.type === 'm2o'
						? schema.collections[nestedNode.relation.related_collection!]!.primary
						: schema.collections[nestedNode.relation.collection]!.primary,
					item,
				);
			}

			for (const [original, version] of versionDirectMap.entries()) {
				if (item[original] === null && item[version]) {
					item[original] = item[version];
				}
			}

			Object.values(VERSION_SYSTEM_FIELDS).forEach(({ field }) => {
				const metaValue = get(item, field);

				if (metaValue) {
					unset(item, field);
					set(item, ['$meta', field], metaValue);
				}
			});

			const fieldsWithFunctionsApplied = fields.map((field) => applyFunctionToColumnName(field));

			item =
				fields.length > 0
					? pick(rawItem, fieldsWithFunctionsApplied, aliasFields, ['$meta'])
					: rawItem[primaryKeyField];

			items.push(item);
		}
	}

	return Array.isArray(rawItem) ? items : items[0]!;
}
