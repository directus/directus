import { useEnv } from '@directus/env';
import type { Accountability, Filter, Item, Permission, Query, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { cloneDeep, merge } from 'lodash-es';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../permissions/lib/fetch-policies.js';
import { PayloadService } from '../../services/payload.js';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode, O2MNode } from '../../types/ast.js';
import { extractFunctionName } from '../../utils/extract-function-name.js';
import { formatAggregate } from '../../versioning/fields.js';
import { formatVersionedLevel, planVersionedRead, type VersionedReadPlan } from '../../versioning/run.js';
import getDatabase from '../index.js';
import { getDBQuery } from './lib/get-db-query.js';
import { parseCurrentLevel } from './lib/parse-current-level.js';
import type { RunASTOptions } from './types.js';
import { applyFunctionToColumnName } from './utils/apply-function-to-column-name.js';
import { applyParentFilters } from './utils/apply-parent-filters.js';
import { mergeWithParentItems } from './utils/merge-with-parent-items.js';
import { removeTemporaryFields } from './utils/remove-temporary-fields.js';

/**
 * Final step of reading data: executes an AST that went through `processAst` using Knex.
 * Queries each level of the tree (versioned nodes read from the combined live and shadow rows),
 * applies the permission `cases`, merges nested relational results into their parent items and
 * runs the items through the payload transforms. Returns the item(s), or a map per collection for a2o nodes.
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
			const versioning = ast.versioning?.[collection];

			if (versioning) {
				const node = {
					name: collection,
					children: ast.children[collection]!,
					query: ast.query[collection]!,
					versioning,
				};

				const plan = planVersionedRead(node, schema, knex);

				results[collection] = await run(
					plan.name,
					plan.children,
					plan.query,
					ast.cases[collection] ?? [],
					accountability,
					plan,
				);

				continue;
			}

			results[collection] = await run(
				collection,
				ast.children[collection]!,
				ast.query[collection]!,
				ast.cases[collection] ?? [],
				accountability,
			);
		}

		return results;
	} else if (ast.versioning) {
		// Versioned nodes read from the combined rows of live items and versions of their collection
		const plan = planVersionedRead({ ...ast, versioning: ast.versioning }, schema, knex);

		const items = await run(plan.name, plan.children, plan.query, ast.cases, accountability, plan);

		if (options?.nested || !items || !(plan.query.group || plan.query.aggregate)) return items;

		// Aggregates on version system fields are returned in the format of the query
		return toArray(items).map((item) => formatAggregate(item, plan.query));
	} else {
		return await run(ast.name, ast.children, options?.query || ast.query, ast.cases, accountability);
	}

	/**
	 * Reads one level of the AST and recursively resolves its nested relations.
	 *
	 * 1. Determines the columns to select and the nested relational nodes of this level.
	 * 2. Queries the items of this level, applying the permission `cases` and, for versioned levels, reading from the
	 *    combined live and version rows (`plan.source`).
	 * 3. Runs the raw rows through the payload transforms.
	 * 4. Limits every nested node to the fetched items (`applyParentFilters`), fetches it with a nested `runAst` call
	 *    (o2m in batches of `RELATIONAL_BATCH_SIZE`, honoring per-item field access flags) and merges the results into
	 *    the parent items.
	 * 5. Formats versioned rows and, for the root call, strips fields that were only added for nesting.
	 *
	 * @param collection - The collection to read from, or the name of the combined versioned read
	 * @param children - The field and relational nodes requested at this level
	 * @param query - The query to apply to this level
	 * @param cases - Permission filters the `whenCase` indices of the children refer to
	 * @param accountability - The accountability used for permissions and payload transforms
	 * @param plan - Set when reading a versioned node, as returned by `planVersionedRead`
	 * @returns The item(s) of this level with their nested relations, or `null` if nothing was found
	 */
	async function run(
		collection: string,
		children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[],
		query: Query,
		cases: Filter[],
		accountability: Accountability | null,
		plan?: VersionedReadPlan,
	) {
		const env = useEnv();
		const readSchema = plan?.schema ?? schema;

		// Retrieve the database columns to select in the current AST
		const { fieldNodes, primaryKeyField, nestedCollectionNodes } = await parseCurrentLevel(
			readSchema,
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
				source: plan?.source,
			},
			{ schema: readSchema, knex },
		);

		const rawItems: Item | Item[] = await dbQuery;

		if (!rawItems) return null;

		// Run the items through the special transforms
		const payloadService = new PayloadService(collection, { accountability, knex, schema: readSchema });

		// Build alias map that includes auto-generated json function field mappings
		// so processJsonFunctionResults can detect and parse stringified JSON values
		const aliasMap: Record<string, string> = { ...query.alias };

		for (const child of children) {
			if (child.type === 'functionField' && extractFunctionName(child.name) === 'json') {
				const alias = applyFunctionToColumnName(child.fieldKey);
				aliasMap[alias] = child.name;
			}
		}

		let items: null | Item | Item[] = await payloadService.processValues(
			'read',
			rawItems,
			aliasMap,
			query.aggregate ?? {},
		);

		if (!items || (Array.isArray(items) && items.length === 0)) return items;

		// Apply the `_in` filters to the nested collection batches
		const nestedNodes = applyParentFilters(schema, nestedCollectionNodes, items);

		for (const nestedNode of nestedNodes) {
			let nestedItems: Item[] | null;

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
							limit: env.RELATIONAL_BATCH_SIZE,
							offset: batchCount * env.RELATIONAL_BATCH_SIZE,
							page: null,
						},
					});

					nestedItems = (await runAst(node, schema, accountability, { knex, nested: true })) as Item[] | null;

					if (nestedItems) {
						items = mergeWithParentItems(schema, nestedItems, items!, nestedNode, fieldAllowed)!;
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

				nestedItems = (await runAst(node, schema, accountability, { knex, nested: true })) as Item[] | null;

				if (nestedItems) {
					// Merge all fetched nested records with the parent items
					items = mergeWithParentItems(schema, nestedItems, items!, nestedNode, true)!;
				}
			}
		}

		if (plan) items = formatVersionedLevel(items, plan, knex);

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
