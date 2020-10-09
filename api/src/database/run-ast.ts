import { AST, FieldNode, M2ONode, NestedCollectionNode, O2MNode } from '../types/ast';
import { clone, cloneDeep, uniq, pick } from 'lodash';
import database from './index';
import SchemaInspector from 'knex-schema-inspector';
import { Query, Item } from '../types';
import { PayloadService } from '../services/payload';
import applyQuery from '../utils/apply-query';
import Knex, { QueryBuilder } from 'knex';

type RunASTOptions = {
	query?: AST['query'];
	knex?: Knex;
	child?: boolean;
};

export default async function runAST(
	originalAST: AST | NestedCollectionNode,
	options?: RunASTOptions
): Promise<null | Item | Item[]> {
	const ast = cloneDeep(originalAST);

	const query = options?.query || ast.query;
	const knex = options?.knex || database;

	if (ast.type === 'm2a') {
		return null;
	} else {
		return await runQuery(ast);
	}

	async function runQuery(ast: AST | O2MNode | M2ONode) {
		// Retrieve the database columns to select in the current AST
		const { columnsToSelect, primaryKeyField, nestedCollectionNodes } = await parseCurrentLevel(
			ast,
			knex
		);

		// The actual knex query builder instance. This is a promise that resolves with the raw items from the db
		const dbQuery = await getDBQuery(knex, ast.name, columnsToSelect, query, primaryKeyField);

		const rawItems: Item | Item[] = await dbQuery;

		if (!rawItems) return null;

		// Run the items through the special transforms
		const payloadService = new PayloadService(ast.name, { knex });
		let items = await payloadService.processValues('read', rawItems);

		if (!items || items.length === 0) return items;

		// Apply the `_in` filters to the nested collection batches
		const nestedNodes = applyParentFilters(nestedCollectionNodes, items);

		for (const nestedNode of nestedNodes) {
			let tempLimit: number | null = null;

			// Nested o2m-items are fetched from the db in a single query. This means that we're fetching
			// all nested items for all parent items at once. Because of this, we can't limit that query
			// to the "standard" item limit. Instead of _n_ nested items per parent item, it would mean
			// that there's _n_ items, which are then divided on the parent items. (no good)
			if (nestedNode.type === 'o2m' && typeof nestedNode.query.limit === 'number') {
				tempLimit = nestedNode.query.limit;
				nestedNode.query.limit = -1;
			}

			let nestedItems = await runAST(nestedNode, { knex, child: true });

			if (nestedItems) {
				// Merge all fetched nested records with the parent items
				items = mergeWithParentItems(nestedItems, items, nestedNode, tempLimit);
			}
		}

		// During the fetching of data, we have to inject a couple of required fields for the child nesting
		// to work (primary / foreign keys) even if they're not explicitly requested. After all fetching
		// and nesting is done, we parse through the output structure, and filter out all non-requested
		// fields
		if (options?.child !== true) {
			items = removeTemporaryFields(items, ast, primaryKeyField);
		}

		return items;
	}
}

async function parseCurrentLevel(ast: AST | O2MNode | M2ONode, knex: Knex) {
	const schemaInspector = SchemaInspector(knex);

	const primaryKeyField = await schemaInspector.primary(ast.name);

	const columnsInCollection = (await schemaInspector.columns(ast.name)).map(
		({ column }) => column
	);

	const columnsToSelect: string[] = [];
	const nestedCollectionNodes: NestedCollectionNode[] = [];

	for (const child of ast.children) {
		if (child.type === 'field') {
			if (columnsInCollection.includes(child.name) || child.name === '*') {
				columnsToSelect.push(child.name);
			}

			continue;
		}

		if (!child.relation) continue;

		if (child.type === 'm2o') {
			columnsToSelect.push(child.relation.many_field);
		}

		nestedCollectionNodes.push(child);
	}

	/** Always fetch primary key in case there's a nested relation that needs it */
	if (columnsToSelect.includes(primaryKeyField) === false) {
		columnsToSelect.push(primaryKeyField);
	}

	return { columnsToSelect, nestedCollectionNodes, primaryKeyField };
}

async function getDBQuery(
	knex: Knex,
	table: string,
	columns: string[],
	query: Query,
	primaryKeyField: string
): Promise<QueryBuilder> {
	let dbQuery = knex.select(columns.map((column) => `${table}.${column}`)).from(table);

	const queryCopy = clone(query);

	queryCopy.limit = typeof queryCopy.limit === 'number' ? queryCopy.limit : 100;

	if (queryCopy.limit === -1) {
		delete queryCopy.limit;
	}

	query.sort = query.sort || [{ column: primaryKeyField, order: 'asc' }];

	await applyQuery(table, dbQuery, queryCopy);

	return dbQuery;
}

function applyParentFilters(
	nestedCollectionNodes: NestedCollectionNode[],
	parentItem: Item | Item[]
) {
	const parentItems = Array.isArray(parentItem) ? parentItem : [parentItem];

	for (const nestedNode of nestedCollectionNodes) {
		if (!nestedNode.relation) continue;

		if (nestedNode.type === 'm2o') {
			nestedNode.query = {
				...nestedNode.query,
				filter: {
					...(nestedNode.query.filter || {}),
					[nestedNode.relation.one_primary!]: {
						_in: uniq(
							parentItems.map((res) => res[nestedNode.relation.many_field])
						).filter((id) => id),
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
						_in: uniq(parentItems.map((res) => res[nestedNode.parentKey])).filter(
							(id) => id
						),
					},
				},
			};
		}
	}

	return nestedCollectionNodes;
}

function mergeWithParentItems(
	nestedItem: Item | Item[],
	parentItem: Item | Item[],
	nestedNode: NestedCollectionNode,
	o2mLimit?: number | null
) {
	const nestedItems = Array.isArray(nestedItem) ? nestedItem : [nestedItem];
	const parentItems = clone(Array.isArray(parentItem) ? parentItem : [parentItem]);

	if (nestedNode.type === 'm2o') {
		for (const parentItem of parentItems) {
			const itemChild = nestedItems.find((nestedItem) => {
				return (
					nestedItem[nestedNode.relation.one_primary!] === parentItem[nestedNode.fieldKey]
				);
			});

			parentItem[nestedNode.fieldKey] = itemChild || null;
		}
	} else if (nestedNode.type === 'o2m') {
		for (const parentItem of parentItems) {
			let itemChildren = nestedItems.filter((nestedItem) => {
				if (nestedItem === null) return false;
				if (Array.isArray(nestedItem[nestedNode.relation.many_field])) return true;

				return (
					nestedItem[nestedNode.relation.many_field] ===
						parentItem[nestedNode.relation.one_primary!] ||
					nestedItem[nestedNode.relation.many_field]?.[
						nestedNode.relation.many_primary
					] === parentItem[nestedNode.relation.one_primary!]
				);
			});

			// We re-apply the requested limit here. This forces the _n_ nested items per parent concept
			if (o2mLimit !== null) {
				itemChildren = itemChildren.slice(0, o2mLimit);
				nestedNode.query.limit = o2mLimit;
			}

			parentItem[nestedNode.fieldKey] = itemChildren.length > 0 ? itemChildren : null;
		}
	}

	return Array.isArray(parentItem) ? parentItems : parentItems[0];
}

function removeTemporaryFields(
	rawItem: Item | Item[],
	ast: AST | O2MNode | M2ONode,
	primaryKeyField: string
): Item | Item[] {
	const rawItems: Item[] = Array.isArray(rawItem) ? rawItem : [rawItem];

	const items: Item[] = [];

	const fields = ast.children
		.filter((child) => child.type === 'field')
		.map((child) => (child as FieldNode).name);

	const nestedCollections = ast.children.filter(
		(child) => child.type !== 'field'
	) as NestedCollectionNode[];

	for (const rawItem of rawItems) {
		if (rawItem === null) return rawItem;

		const item = fields.length > 0 ? pick(rawItem, fields) : rawItem[primaryKeyField];

		for (const nestedCollection of nestedCollections) {
			if (item[nestedCollection.fieldKey] !== null && nestedCollection.type !== 'm2a') {
				/** @TODO REMOVE M2A CHECK HERE */
				item[nestedCollection.fieldKey] = removeTemporaryFields(
					rawItem[nestedCollection.fieldKey],
					nestedCollection,
					nestedCollection.parentKey
				);
			}
		}

		items.push(item);
	}

	return Array.isArray(rawItem) ? items : items[0];
}
