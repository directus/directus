import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../permissions/lib/fetch-policies.js';
import { PayloadService } from '../../services/payload.js';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode, O2MNode } from '../../types/ast.js';
import getDatabase from '../index.js';
import { getDBQuery } from './lib/get-db-query.js';
import { parseCurrentLevel } from './lib/parse-current-level.js';
import type { RunASTOptions } from './types.js';
import { applyParentFilters } from './utils/apply-parent-filters.js';
import { mergeWithParentItems } from './utils/merge-with-parent-items.js';
import { removeTemporaryFields } from './utils/remove-temporary-fields.js';
import { useEnv } from '@directus/env';
import type { Accountability, Filter, Item, Permission, Query, SchemaOverview } from '@directus/types';
import { cloneDeep, merge } from 'lodash-es';

/**
 * Execute a given AST using Knex. Returns array of items based on requested AST.
 */
export async function runAst(
	originalAST: AST | NestedCollectionNode,
	schema: SchemaOverview,
	accountability: Accountability | null,
	options?: RunASTOptions,
): Promise<null | Item | Item[]> {
	const ast = cloneDeep(originalAST);

	const knex = options?.knex || getDatabase();

	if (ast.type === 'a2o') {
		const results: { [collection: string]: null | Item | Item[] } = {};

		for (const collection of ast.names) {
			results[collection] = await run(
				collection,
				ast.children[collection]!,
				ast.query[collection]!,
				ast.cases[collection] ?? [],
				accountability,
			);
		}

		return results;
	} else {
		return await run(ast.name, ast.children, options?.query || ast.query, ast.cases, accountability);
	}

	async function run(
		collection: string,
		children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
		query: Query,
		cases: Filter[],
		accountability: Accountability | null,
	) {
		const env = useEnv();

		// Retrieve the database columns to select in the current AST
		const { fieldNodes, primaryKeyField, nestedCollectionNodes } = await parseCurrentLevel(
			schema,
			collection,
			children,
			query,
		);

		const o2mNodes = nestedCollectionNodes.filter((node): node is O2MNode => node.type === 'o2m');

		let permissions: Permission[] = [];

		if (accountability && !accountability.admin) {
			const policies = await fetchPolicies(accountability, { schema, knex });
			permissions = await fetchPermissions({ action: 'read', accountability, policies }, { schema, knex });
		}

		// The actual knex query builder instance. This is a promise that resolves with the raw items from the db
		const dbQuery = getDBQuery(
			{
				table: collection,
				fieldNodes,
				o2mNodes,
				query,
				cases,
				permissions,
			},
			{ schema, knex },
		);

		const rawItems: Item | Item[] = await dbQuery;

		if (!rawItems) return null;

		// Run the items through the special transforms
		const payloadService = new PayloadService(collection, { accountability, knex, schema });

		let items: null | Item | Item[] = await payloadService.processValues(
			'read',
			rawItems,
			query.alias ?? {},
			query.aggregate ?? {},
		);

		if (!items || (Array.isArray(items) && items.length === 0)) return items;

		// Apply the `_in` filters to the nested collection batches
		const nestedNodes = applyParentFilters(schema, nestedCollectionNodes, items);

		for (const nestedNode of nestedNodes) {
			let nestedItems: Item[] | null = [];

			if (nestedNode.type === 'o2m') {
				let hasMore = true;

				let batchCount = 0;

				// If a nested node has a whenCase it indicates that the user might not be able to access the field for all items.
				// In that case the queried item includes a flag under the fieldKey that is populated in the db and indicates
				// if the user has access to that field for that specific item.
				const hasWhenCase = nestedNode.whenCase && nestedNode.whenCase.length > 0;
				let fieldAllowed: boolean | boolean[] = true;

				if (hasWhenCase) {
					// Extract flag and remove field from item, so it can be populated with the actual items
					if (Array.isArray(items)) {
						fieldAllowed = [];

						for (const item of items) {
							fieldAllowed.push(!!item[nestedNode.fieldKey]);
							delete item[nestedNode.fieldKey];
						}
					} else {
						fieldAllowed = !!items[nestedNode.fieldKey];
						delete items[nestedNode.fieldKey];
					}
				}

				while (hasMore) {
					const node = merge({}, nestedNode, {
						query: {
							limit: env['RELATIONAL_BATCH_SIZE'],
							offset: batchCount * (env['RELATIONAL_BATCH_SIZE'] as number),
							page: null,
						},
					});

					nestedItems = (await runAst(node, schema, accountability, { knex, nested: true })) as Item[] | null;

					if (nestedItems) {
						items = mergeWithParentItems(schema, nestedItems, items!, nestedNode, fieldAllowed)!;
					}

					if (!nestedItems || nestedItems.length < (env['RELATIONAL_BATCH_SIZE'] as number)) {
						hasMore = false;
					}

					batchCount++;
				}
			} else {
				const node = merge({}, nestedNode, {
					query: { limit: -1 },
				});

				nestedItems = (await runAst(node, schema, accountability, { knex, nested: true })) as Item[] | null;

				if (nestedItems) {
					// Merge all fetched nested records with the parent items
					items = mergeWithParentItems(schema, nestedItems, items!, nestedNode, true)!;
				}
			}
		}

		// During the fetching of data, we have to inject a couple of required fields for the child nesting
		// to work (primary / foreign keys) even if they're not explicitly requested. After all fetching
		// and nesting is done, we parse through the output structure, and filter out all non-requested
		// fields
		// The field allowed flags injected in `getDBQuery` are already removed while processing the nested nodes in
		// the previous step.
		if (options?.nested !== true && options?.stripNonRequested !== false) {
			items = removeTemporaryFields(schema, items, originalAST, primaryKeyField);
		}

		return items;
	}
}
