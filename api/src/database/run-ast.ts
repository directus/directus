import { Item, Query, SchemaOverview } from '@directus/shared/types';
import { toArray } from '@directus/shared/utils';
import { Knex } from 'knex';
import { clone, cloneDeep, merge, pick, uniq } from 'lodash';
import getDatabase from '.';
import { getHelpers } from '../database/helpers';
import env from '../env';
import { PayloadService } from '../services/payload';
import { AST, FieldNode, M2ONode, NestedCollectionNode } from '../types/ast';
import { applyFunctionToColumnName } from '../utils/apply-function-to-column-name';
import applyQuery from '../utils/apply-query';
import { getColumn } from '../utils/get-column';
import { stripFunction } from '../utils/strip-function';

type RunASTOptions = {
	/**
	 * Query override for the current level
	 */
	query?: AST['query'];

	/**
	 * Knex instance
	 */
	knex?: Knex;

	/**
	 * Whether or not the current execution is a nested dataset in another AST
	 */
	nested?: boolean;

	/**
	 * Whether or not to strip out non-requested required fields automatically (eg IDs / FKs)
	 */
	stripNonRequested?: boolean;
};

/**
 * Execute a given AST using Knex. Returns array of items based on requested AST.
 */
export default async function runAST(
	originalAST: AST | NestedCollectionNode,
	schema: SchemaOverview,
	options?: RunASTOptions
): Promise<null | Item | Item[]> {
	const ast = cloneDeep(originalAST);

	const knex = options?.knex || getDatabase();

	if (ast.type === 'a2o') {
		const results: { [collection: string]: null | Item | Item[] } = {};

		for (const collection of ast.names) {
			results[collection] = await run(collection, ast.children[collection], ast.query[collection]);
		}

		return results;
	} else {
		return await run(ast.name, ast.children, options?.query || ast.query);
	}

	async function run(collection: string, children: (NestedCollectionNode | FieldNode)[], query: Query) {
		// Retrieve the database columns to select in the current AST
		const { fieldNodes, primaryKeyField, nestedCollectionNodes } = await parseCurrentLevel(
			schema,
			collection,
			children,
			query
		);

		// The actual knex query builder instance. This is a promise that resolves with the raw items from the db
		const dbQuery = getDBQuery(schema, knex, collection, fieldNodes, query);

		const rawItems: Item | Item[] = await dbQuery;

		if (!rawItems) return null;

		// Run the items through the special transforms
		const payloadService = new PayloadService(collection, { knex, schema });
		let items: null | Item | Item[] = await payloadService.processValues('read', rawItems);

		if (!items || items.length === 0) return items;

		// Apply the `_in` filters to the nested collection batches
		const nestedNodes = applyParentFilters(schema, nestedCollectionNodes, items);

		for (const nestedNode of nestedNodes) {
			let nestedItems: Item[] | null = [];

			if (nestedNode.type === 'o2m') {
				let hasMore = true;

				let batchCount = 0;

				while (hasMore) {
					const node = merge({}, nestedNode, {
						query: { limit: env.RELATIONAL_BATCH_SIZE, offset: batchCount * env.RELATIONAL_BATCH_SIZE },
					});

					nestedItems = (await runAST(node, schema, { knex, nested: true })) as Item[] | null;

					if (nestedItems) {
						items = mergeWithParentItems(schema, nestedItems, items, nestedNode);
					}

					if (!nestedItems || nestedItems.length < env.RELATIONAL_BATCH_SIZE) {
						hasMore = false;
					}

					batchCount++;
				}
			} else {
				const node = merge({}, nestedNode, {
					query: { limit: -1 },
				});

				nestedItems = (await runAST(node, schema, { knex, nested: true })) as Item[] | null;

				if (nestedItems) {
					// Merge all fetched nested records with the parent items
					items = mergeWithParentItems(schema, nestedItems, items, nestedNode);
				}
			}
		}

		// During the fetching of data, we have to inject a couple of required fields for the child nesting
		// to work (primary / foreign keys) even if they're not explicitly requested. After all fetching
		// and nesting is done, we parse through the output structure, and filter out all non-requested
		// fields
		if (options?.nested !== true && options?.stripNonRequested !== false) {
			items = removeTemporaryFields(schema, items, originalAST, primaryKeyField);
		}

		return items;
	}
}

async function parseCurrentLevel(
	schema: SchemaOverview,
	collection: string,
	children: (NestedCollectionNode | FieldNode)[],
	query: Query
) {
	const primaryKeyField = schema.collections[collection].primary;
	const columnsInCollection = Object.keys(schema.collections[collection].fields);

	const columnsToSelectInternal: string[] = [];
	const nestedCollectionNodes: NestedCollectionNode[] = [];

	for (const child of children) {
		if (child.type === 'field') {
			const fieldKey = stripFunction(child.name);

			if (columnsInCollection.includes(fieldKey) || fieldKey === '*') {
				columnsToSelectInternal.push(child.name); // maintain original name here (includes functions)

				if (query.alias) {
					columnsToSelectInternal.push(
						...Object.entries(query.alias)
							.filter(([_key, value]) => value === child.name)
							.map(([key]) => key)
					);
				}
			}

			continue;
		}

		if (!child.relation) continue;

		if (child.type === 'm2o') {
			columnsToSelectInternal.push(child.relation.field);
		}

		if (child.type === 'a2o') {
			columnsToSelectInternal.push(child.relation.field);
			columnsToSelectInternal.push(child.relation.meta!.one_collection_field!);
		}

		nestedCollectionNodes.push(child);
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
				(childNode) => childNode.type === 'field' && (childNode.fieldKey === column || childNode.name === column)
			) ?? {
				type: 'field',
				name: column,
				fieldKey: column,
			}
	) as FieldNode[];

	return { fieldNodes, nestedCollectionNodes, primaryKeyField };
}

function getColumnPreprocessor(knex: Knex, schema: SchemaOverview, table: string) {
	const helpers = getHelpers(knex);

	return function (fieldNode: FieldNode | M2ONode): Knex.Raw<string> {
		let field;

		if (fieldNode.type === 'field') {
			field = schema.collections[table].fields[stripFunction(fieldNode.name)];
		} else {
			field = schema.collections[fieldNode.relation.collection].fields[fieldNode.relation.field];
		}

		let alias = undefined;

		if (fieldNode.name !== fieldNode.fieldKey) {
			alias = fieldNode.fieldKey;
		}

		if (field.type.startsWith('geometry')) {
			return helpers.st.asText(table, field.field);
		}

		return getColumn(knex, table, fieldNode.name, alias, schema);
	};
}

function getDBQuery(
	schema: SchemaOverview,
	knex: Knex,
	table: string,
	fieldNodes: FieldNode[],
	query: Query
): Knex.QueryBuilder {
	const preProcess = getColumnPreprocessor(knex, schema, table);
	const dbQuery = knex.select(fieldNodes.map(preProcess)).from(table);
	const queryCopy = clone(query);

	queryCopy.limit = typeof queryCopy.limit === 'number' ? queryCopy.limit : 100;

	return applyQuery(knex, table, dbQuery, queryCopy, schema);
}

function applyParentFilters(
	schema: SchemaOverview,
	nestedCollectionNodes: NestedCollectionNode[],
	parentItem: Item | Item[]
) {
	const parentItems = toArray(parentItem);

	for (const nestedNode of nestedCollectionNodes) {
		if (!nestedNode.relation) continue;

		if (nestedNode.type === 'm2o') {
			const foreignField = schema.collections[nestedNode.relation.related_collection!].primary;
			const foreignIds = uniq(parentItems.map((res) => res[nestedNode.relation.field])).filter((id) => id);

			merge(nestedNode, { query: { filter: { [foreignField]: { _in: foreignIds } } } });
		} else if (nestedNode.type === 'o2m') {
			const relatedM2OisFetched = !!nestedNode.children.find((child) => {
				return child.type === 'field' && child.name === nestedNode.relation.field;
			});

			if (relatedM2OisFetched === false) {
				nestedNode.children.push({
					type: 'field',
					name: nestedNode.relation.field,
					fieldKey: nestedNode.relation.field,
				});
			}

			if (nestedNode.relation.meta?.sort_field) {
				nestedNode.children.push({
					type: 'field',
					name: nestedNode.relation.meta.sort_field,
					fieldKey: nestedNode.relation.meta.sort_field,
				});
			}

			const foreignField = nestedNode.relation.field;
			const foreignIds = uniq(parentItems.map((res) => res[nestedNode.parentKey])).filter((id) => id);

			merge(nestedNode, { query: { filter: { [foreignField]: { _in: foreignIds } } } });
		} else if (nestedNode.type === 'a2o') {
			const keysPerCollection: { [collection: string]: (string | number)[] } = {};

			for (const parentItem of parentItems) {
				const collection = parentItem[nestedNode.relation.meta!.one_collection_field!];
				if (!keysPerCollection[collection]) keysPerCollection[collection] = [];
				keysPerCollection[collection].push(parentItem[nestedNode.relation.field]);
			}

			for (const relatedCollection of nestedNode.names) {
				const foreignField = nestedNode.relatedKey[relatedCollection];
				const foreignIds = uniq(keysPerCollection[relatedCollection]);

				merge(nestedNode, {
					query: { [relatedCollection]: { filter: { [foreignField]: { _in: foreignIds } } } },
				});
			}
		}
	}

	return nestedCollectionNodes;
}

function mergeWithParentItems(
	schema: SchemaOverview,
	nestedItem: Item | Item[],
	parentItem: Item | Item[],
	nestedNode: NestedCollectionNode
) {
	const nestedItems = toArray(nestedItem);
	const parentItems = clone(toArray(parentItem));

	if (nestedNode.type === 'm2o') {
		for (const parentItem of parentItems) {
			const itemChild = nestedItems.find((nestedItem) => {
				return (
					nestedItem[schema.collections[nestedNode.relation.related_collection!].primary] ==
					parentItem[nestedNode.relation.field]
				);
			});

			parentItem[nestedNode.fieldKey] = itemChild || null;
		}
	} else if (nestedNode.type === 'o2m') {
		for (const parentItem of parentItems) {
			if (!parentItem[nestedNode.fieldKey]) parentItem[nestedNode.fieldKey] = [] as Item[];

			const itemChildren = nestedItems.filter((nestedItem) => {
				if (nestedItem === null) return false;
				if (Array.isArray(nestedItem[nestedNode.relation.field])) return true;

				return (
					nestedItem[nestedNode.relation.field] ==
						parentItem[schema.collections[nestedNode.relation.related_collection!].primary] ||
					nestedItem[nestedNode.relation.field]?.[
						schema.collections[nestedNode.relation.related_collection!].primary
					] == parentItem[schema.collections[nestedNode.relation.related_collection!].primary]
				);
			});

			parentItem[nestedNode.fieldKey].push(...itemChildren);

			if (nestedNode.query.offset && nestedNode.query.offset >= 0) {
				parentItem[nestedNode.fieldKey] = parentItem[nestedNode.fieldKey].slice(nestedNode.query.offset);
			}

			if (nestedNode.query.limit !== -1) {
				parentItem[nestedNode.fieldKey] = parentItem[nestedNode.fieldKey].slice(0, nestedNode.query.limit ?? 100);
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

			const itemChild = (nestedItem as Record<string, any[]>)[relatedCollection].find((nestedItem) => {
				return nestedItem[nestedNode.relatedKey[relatedCollection]] == parentItem[nestedNode.fieldKey];
			});

			parentItem[nestedNode.fieldKey] = itemChild || null;
		}
	}

	return Array.isArray(parentItem) ? parentItems : parentItems[0];
}

function removeTemporaryFields(
	schema: SchemaOverview,
	rawItem: Item | Item[],
	ast: AST | NestedCollectionNode,
	primaryKeyField: string,
	parentItem?: Item
): null | Item | Item[] {
	const rawItems = cloneDeep(toArray(rawItem));
	const items: Item[] = [];

	if (ast.type === 'a2o') {
		const fields: Record<string, string[]> = {};
		const nestedCollectionNodes: Record<string, NestedCollectionNode[]> = {};

		for (const relatedCollection of ast.names) {
			if (!fields[relatedCollection]) fields[relatedCollection] = [];
			if (!nestedCollectionNodes[relatedCollection]) nestedCollectionNodes[relatedCollection] = [];

			for (const child of ast.children[relatedCollection]) {
				if (child.type === 'field') {
					fields[relatedCollection].push(child.name);
				} else {
					fields[relatedCollection].push(child.fieldKey);
					nestedCollectionNodes[relatedCollection].push(child);
				}
			}
		}

		for (const rawItem of rawItems) {
			const relatedCollection: string = parentItem?.[ast.relation.meta!.one_collection_field!];

			if (rawItem === null || rawItem === undefined) return rawItem;

			let item = rawItem;

			for (const nestedNode of nestedCollectionNodes[relatedCollection]) {
				item[nestedNode.fieldKey] = removeTemporaryFields(
					schema,
					item[nestedNode.fieldKey],
					nestedNode,
					schema.collections[nestedNode.relation.collection].primary,
					item
				);
			}

			item = fields[relatedCollection].length > 0 ? pick(rawItem, fields[relatedCollection]) : rawItem[primaryKeyField];

			items.push(item);
		}
	} else {
		const fields: string[] = [];
		const nestedCollectionNodes: NestedCollectionNode[] = [];

		for (const child of ast.children) {
			fields.push(child.fieldKey);

			if (child.type !== 'field') {
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
						? schema.collections[nestedNode.relation.related_collection!].primary
						: schema.collections[nestedNode.relation.collection].primary,
					item
				);
			}

			const fieldsWithFunctionsApplied = fields.map((field) => applyFunctionToColumnName(field));

			item = fields.length > 0 ? pick(rawItem, fieldsWithFunctionsApplied) : rawItem[primaryKeyField];

			items.push(item);
		}
	}

	return Array.isArray(rawItem) ? items : items[0];
}
