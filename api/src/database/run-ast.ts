import { AST, NestedCollectionAST } from '../types/ast';
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
	originalAST: AST,
	options?: RunASTOptions
): Promise<null | Item | Item[]> {
	const ast = cloneDeep(originalAST);

	const query = options?.query || ast.query;
	const knex = options?.knex || database;

	// Retrieve the database columns to select in the current AST
	const { columnsToSelect, primaryKeyField, nestedCollectionASTs } = await parseCurrentLevel(
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
	const nestedASTs = applyParentFilters(nestedCollectionASTs, items);

	for (const nestedAST of nestedASTs) {
		let tempLimit: number | null = null;

		// Nested o2m-items are fetched from the db in a single query. This means that we're fetching
		// all nested items for all parent items at once. Because of this, we can't limit that query
		// to the "standard" item limit. Instead of _n_ nested items per parent item, it would mean
		// that there's _n_ items, which are then divided on the parent items. (no good)
		if (isO2M(nestedAST) && typeof nestedAST.query.limit === 'number') {
			tempLimit = nestedAST.query.limit;
			nestedAST.query.limit = -1;
		}

		let nestedItems = await runAST(nestedAST, { knex, child: true });

		if (nestedItems) {
			// Merge all fetched nested records with the parent items
			items = mergeWithParentItems(nestedItems, items, nestedAST, tempLimit);
		}
	}

	// During the fetching of data, we have to inject a couple of required fields for the child nesting
	// to work (primary / foreign keys) even if they're not explicitly requested. After all fetching
	// and nesting is done, we parse through the output structure, and filter out all non-requested
	// fields
	if (options?.child !== true) {
		items = removeTemporaryFields(items, originalAST, primaryKeyField);
	}

	return items;
}

async function parseCurrentLevel(ast: AST, knex: Knex) {
	const schemaInspector = SchemaInspector(knex);

	const primaryKeyField = await schemaInspector.primary(ast.name);

	const columnsInCollection = (await schemaInspector.columns(ast.name)).map(
		({ column }) => column
	);

	const columnsToSelect: string[] = [];
	const nestedCollectionASTs: NestedCollectionAST[] = [];

	for (const child of ast.children) {
		if (child.type === 'field') {
			if (columnsInCollection.includes(child.name) || child.name === '*') {
				columnsToSelect.push(child.name);
			}

			continue;
		}

		if (!child.relation) continue;

		const m2o = isM2O(child);

		if (m2o) {
			columnsToSelect.push(child.relation.many_field);
		}

		nestedCollectionASTs.push(child);
	}

	/** Always fetch primary key in case there's a nested relation that needs it */
	if (columnsToSelect.includes(primaryKeyField) === false) {
		columnsToSelect.push(primaryKeyField);
	}

	return { columnsToSelect, nestedCollectionASTs, primaryKeyField };
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
	nestedCollectionASTs: NestedCollectionAST[],
	parentItem: Item | Item[]
) {
	const parentItems = Array.isArray(parentItem) ? parentItem : [parentItem];

	for (const nestedAST of nestedCollectionASTs) {
		if (!nestedAST.relation) continue;

		if (isM2O(nestedAST)) {
			nestedAST.query = {
				...nestedAST.query,
				filter: {
					...(nestedAST.query.filter || {}),
					[nestedAST.relation.one_primary]: {
						_in: uniq(
							parentItems.map((res) => res[nestedAST.relation.many_field])
						).filter((id) => id),
					},
				},
			};
		} else {
			const relatedM2OisFetched = !!nestedAST.children.find((child) => {
				return child.type === 'field' && child.name === nestedAST.relation.many_field;
			});

			if (relatedM2OisFetched === false) {
				nestedAST.children.push({ type: 'field', name: nestedAST.relation.many_field });
			}

			nestedAST.query = {
				...nestedAST.query,
				filter: {
					...(nestedAST.query.filter || {}),
					[nestedAST.relation.many_field]: {
						_in: uniq(parentItems.map((res) => res[nestedAST.parentKey])).filter(
							(id) => id
						),
					},
				},
			};
		}
	}

	return nestedCollectionASTs;
}

function mergeWithParentItems(
	nestedItem: Item | Item[],
	parentItem: Item | Item[],
	nestedAST: NestedCollectionAST,
	o2mLimit?: number | null
) {
	const nestedItems = Array.isArray(nestedItem) ? nestedItem : [nestedItem];
	const parentItems = clone(Array.isArray(parentItem) ? parentItem : [parentItem]);

	if (isM2O(nestedAST)) {
		for (const parentItem of parentItems) {
			const itemChild = nestedItems.find((nestedItem) => {
				return (
					nestedItem[nestedAST.relation.one_primary] === parentItem[nestedAST.fieldKey]
				);
			});

			parentItem[nestedAST.fieldKey] = itemChild || null;
		}
	} else {
		for (const parentItem of parentItems) {
			let itemChildren = nestedItems.filter((nestedItem) => {
				if (nestedItem === null) return false;
				if (Array.isArray(nestedItem[nestedAST.relation.many_field])) return true;

				return (
					nestedItem[nestedAST.relation.many_field] ===
						parentItem[nestedAST.relation.one_primary] ||
					nestedItem[nestedAST.relation.many_field]?.[nestedAST.relation.many_primary] ===
						parentItem[nestedAST.relation.one_primary]
				);
			});

			// We re-apply the requested limit here. This forces the _n_ nested items per parent concept
			if (o2mLimit !== null) {
				itemChildren = itemChildren.slice(0, o2mLimit);
				nestedAST.query.limit = o2mLimit;
			}

			parentItem[nestedAST.fieldKey] = itemChildren.length > 0 ? itemChildren : null;
		}
	}

	return Array.isArray(parentItem) ? parentItems : parentItems[0];
}

function removeTemporaryFields(
	rawItem: Item | Item[],
	ast: AST | NestedCollectionAST,
	primaryKeyField: string
): Item | Item[] {
	const rawItems: Item[] = Array.isArray(rawItem) ? rawItem : [rawItem];

	const items: Item[] = [];

	const fields = ast.children
		.filter((child) => child.type === 'field')
		.map((child) => child.name);
	const nestedCollections = ast.children.filter(
		(child) => child.type === 'collection'
	) as NestedCollectionAST[];

	for (const rawItem of rawItems) {
		if (rawItem === null) return rawItem;

		const item = fields.length > 0 ? pick(rawItem, fields) : rawItem[primaryKeyField];

		for (const nestedCollection of nestedCollections) {
			if (item[nestedCollection.fieldKey] !== null) {
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

function isM2O(child: NestedCollectionAST) {
	return (
		child.relation.one_collection === child.name && child.relation.many_field === child.fieldKey
	);
}

function isO2M(child: NestedCollectionAST) {
	return isM2O(child) === false;
}
