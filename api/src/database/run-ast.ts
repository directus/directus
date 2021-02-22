import { AST, NestedCollectionNode, FieldNode } from '../types/ast';
import { clone, cloneDeep, uniq, pick } from 'lodash';
import database from './index';
import { Query, Item, SchemaOverview } from '../types';
import { PayloadService } from '../services/payload';
import applyQuery from '../utils/apply-query';
import Knex, { QueryBuilder } from 'knex';
import { toArray } from '../utils/to-array';

type RunASTOptions = {
	query?: AST['query'];
	knex?: Knex;
	nested?: boolean;
	stripNonRequested?: boolean;
};

export default async function runAST(
	originalAST: AST | NestedCollectionNode,
	schema: SchemaOverview,
	options?: RunASTOptions
): Promise<null | Item | Item[]> {
	const ast = cloneDeep(originalAST);

	const knex = options?.knex || database;

	if (ast.type === 'm2a') {
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
		const { columnsToSelect, primaryKeyField, nestedCollectionNodes } = await parseCurrentLevel(
			collection,
			children,
			schema
		);

		// The actual knex query builder instance. This is a promise that resolves with the raw items from the db
		const dbQuery = await getDBQuery(
			knex,
			collection,
			columnsToSelect,
			query,
			primaryKeyField,
			schema,
			options?.nested
		);

		const rawItems: Item | Item[] = await dbQuery;

		if (!rawItems) return null;

		// Run the items through the special transforms
		const payloadService = new PayloadService(collection, { knex, schema });
		let items: null | Item | Item[] = await payloadService.processValues('read', rawItems);

		if (!items || items.length === 0) return items;

		// Apply the `_in` filters to the nested collection batches
		const nestedNodes = applyParentFilters(nestedCollectionNodes, items);

		for (const nestedNode of nestedNodes) {
			let nestedItems = await runAST(nestedNode, schema, { knex, nested: true });

			if (nestedItems) {
				// Merge all fetched nested records with the parent items
				items = mergeWithParentItems(nestedItems, items, nestedNode, true);
			}
		}

		// During the fetching of data, we have to inject a couple of required fields for the child nesting
		// to work (primary / foreign keys) even if they're not explicitly requested. After all fetching
		// and nesting is done, we parse through the output structure, and filter out all non-requested
		// fields
		if (options?.nested !== true && options?.stripNonRequested !== false) {
			items = removeTemporaryFields(items, originalAST, primaryKeyField);
		}

		return items;
	}
}

async function parseCurrentLevel(
	collection: string,
	children: (NestedCollectionNode | FieldNode)[],
	schema: SchemaOverview
) {
	const primaryKeyField = schema.tables[collection].primary;
	const columnsInCollection = Object.keys(schema.tables[collection].columns);

	const columnsToSelectInternal: string[] = [];
	const nestedCollectionNodes: NestedCollectionNode[] = [];

	for (const child of children) {
		if (child.type === 'field') {
			if (columnsInCollection.includes(child.name) || child.name === '*') {
				columnsToSelectInternal.push(child.name);
			}

			continue;
		}

		if (!child.relation) continue;

		if (child.type === 'm2o') {
			columnsToSelectInternal.push(child.relation.many_field);
		}

		if (child.type === 'm2a') {
			columnsToSelectInternal.push(child.relation.many_field);
			columnsToSelectInternal.push(child.relation.one_collection_field!);
		}

		nestedCollectionNodes.push(child);
	}

	/** Always fetch primary key in case there's a nested relation that needs it */
	if (columnsToSelectInternal.includes(primaryKeyField) === false) {
		columnsToSelectInternal.push(primaryKeyField);
	}

	/** Make sure select list has unique values */
	const columnsToSelect = [...new Set(columnsToSelectInternal)];

	return { columnsToSelect, nestedCollectionNodes, primaryKeyField };
}

function getDBQuery(
	knex: Knex,
	table: string,
	columns: string[],
	query: Query,
	primaryKeyField: string,
	schema: SchemaOverview,
	nested?: boolean
): QueryBuilder {
	let dbQuery = knex.select(columns.map((column) => `${table}.${column}`)).from(table);

	const queryCopy = clone(query);

	queryCopy.limit = typeof queryCopy.limit === 'number' ? queryCopy.limit : 100;

	// Nested collection sets are retrieved as a batch request (select w/ a filter)
	// "in", so we shouldn't limit that query, as it's a single request for all
	// nested items, instead of a query per row
	if (queryCopy.limit === -1 || nested) {
		delete queryCopy.limit;
	}

	query.sort = query.sort || [{ column: primaryKeyField, order: 'asc' }];

	applyQuery(table, dbQuery, queryCopy, schema);

	// Nested filters use joins to filter on the parent level, to prevent duplicate
	// parents, we group the query by the current tables primary key (which is unique)
	// ref #3798
	dbQuery.groupBy(`${table}.${primaryKeyField}`);

	return dbQuery;
}

function applyParentFilters(nestedCollectionNodes: NestedCollectionNode[], parentItem: Item | Item[]) {
	const parentItems = toArray(parentItem);

	for (const nestedNode of nestedCollectionNodes) {
		if (!nestedNode.relation) continue;

		if (nestedNode.type === 'm2o') {
			nestedNode.query = {
				...nestedNode.query,
				filter: {
					...(nestedNode.query.filter || {}),
					[nestedNode.relation.one_primary!]: {
						_in: uniq(parentItems.map((res) => res[nestedNode.relation.many_field])).filter((id) => id),
					},
				},
			};
		} else if (nestedNode.type === 'o2m') {
			const relatedM2OisFetched = !!nestedNode.children.find((child) => {
				return child.type === 'field' && child.name === nestedNode.relation.many_field;
			});

			if (relatedM2OisFetched === false) {
				nestedNode.children.push({ type: 'field', name: nestedNode.relation.many_field });
			}

			nestedNode.query = {
				...nestedNode.query,
				filter: {
					...(nestedNode.query.filter || {}),
					[nestedNode.relation.many_field]: {
						_in: uniq(parentItems.map((res) => res[nestedNode.parentKey])).filter((id) => id),
					},
				},
			};
		} else if (nestedNode.type === 'm2a') {
			const keysPerCollection: { [collection: string]: (string | number)[] } = {};

			for (const parentItem of parentItems) {
				const collection = parentItem[nestedNode.relation.one_collection_field!];
				if (!keysPerCollection[collection]) keysPerCollection[collection] = [];
				keysPerCollection[collection].push(parentItem[nestedNode.relation.many_field]);
			}

			for (const relatedCollection of nestedNode.names) {
				nestedNode.query[relatedCollection] = {
					...nestedNode.query[relatedCollection],
					filter: {
						_and: [
							nestedNode.query[relatedCollection].filter,
							{
								[nestedNode.relatedKey[relatedCollection]]: {
									_in: uniq(keysPerCollection[relatedCollection]),
								},
							},
						].filter((f) => f),
					},
				};
			}
		}
	}

	return nestedCollectionNodes;
}

function mergeWithParentItems(
	nestedItem: Item | Item[],
	parentItem: Item | Item[],
	nestedNode: NestedCollectionNode,
	nested?: boolean
) {
	const nestedItems = toArray(nestedItem);
	const parentItems = clone(toArray(parentItem));

	if (nestedNode.type === 'm2o') {
		for (const parentItem of parentItems) {
			const itemChild = nestedItems.find((nestedItem) => {
				return nestedItem[nestedNode.relation.one_primary!] == parentItem[nestedNode.fieldKey];
			});

			parentItem[nestedNode.fieldKey] = itemChild || null;
		}
	} else if (nestedNode.type === 'o2m') {
		for (const parentItem of parentItems) {
			let itemChildren = nestedItems.filter((nestedItem) => {
				if (nestedItem === null) return false;
				if (Array.isArray(nestedItem[nestedNode.relation.many_field])) return true;

				return (
					nestedItem[nestedNode.relation.many_field] == parentItem[nestedNode.relation.one_primary!] ||
					nestedItem[nestedNode.relation.many_field]?.[nestedNode.relation.one_primary!] ==
						parentItem[nestedNode.relation.one_primary!]
				);
			});

			// We re-apply the requested limit here. This forces the _n_ nested items per parent concept
			if (nested) {
				itemChildren = itemChildren.slice(0, nestedNode.query.limit ?? 100);
			}

			parentItem[nestedNode.fieldKey] = itemChildren.length > 0 ? itemChildren : null;
		}
	} else if (nestedNode.type === 'm2a') {
		for (const parentItem of parentItems) {
			if (!nestedNode.relation.one_collection_field) {
				parentItem[nestedNode.fieldKey] = null;
				continue;
			}

			const relatedCollection = parentItem[nestedNode.relation.one_collection_field];

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
	rawItem: Item | Item[],
	ast: AST | NestedCollectionNode,
	primaryKeyField: string,
	parentItem?: Item
): null | Item | Item[] {
	const rawItems = cloneDeep(toArray(rawItem));
	const items: Item[] = [];

	if (ast.type === 'm2a') {
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
			const relatedCollection: string = parentItem?.[ast.relation.one_collection_field!];

			if (rawItem === null || rawItem === undefined) return rawItem;

			let item = rawItem;

			for (const nestedNode of nestedCollectionNodes[relatedCollection]) {
				item[nestedNode.fieldKey] = removeTemporaryFields(
					item[nestedNode.fieldKey],
					nestedNode,
					nestedNode.relation.many_primary,
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
			if (child.type === 'field') {
				fields.push(child.name);
			} else {
				fields.push(child.fieldKey);
				nestedCollectionNodes.push(child);
			}
		}

		for (const rawItem of rawItems) {
			if (rawItem === null || rawItem === undefined) return rawItem;

			let item = rawItem;

			for (const nestedNode of nestedCollectionNodes) {
				item[nestedNode.fieldKey] = removeTemporaryFields(
					item[nestedNode.fieldKey],
					nestedNode,
					nestedNode.type === 'm2o' ? nestedNode.relation.one_primary! : nestedNode.relation.many_primary,
					item
				);
			}

			item = fields.length > 0 ? pick(rawItem, fields) : rawItem[primaryKeyField];

			items.push(item);
		}
	}

	return Array.isArray(rawItem) ? items : items[0];
}
