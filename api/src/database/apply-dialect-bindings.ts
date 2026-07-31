import type { Knex } from 'knex';
import { getHelpers } from './helpers/index.js';

/**
 * Compose the dialect's `SchemaHelper.prepBindings` onto the knex client, so a driver that mangles
 * certain binding values can correct them for every query the connection runs.
 *
 * `Client.prepBindings` is the seam for this: it's part of knex's published `Knex.Client` surface,
 * knex's own oracledb dialect overrides it for the same kind of driver quirk, and every query passes
 * through it via `enrichQueryObject`, whether it came from the query builder, from `knex.raw`, or
 * from the schema builder.
 *
 * This is deliberately separate from `prepQueryParamBindings`, which `withPreprocessBindings`
 * applies per query alongside a `prepQueryParams` SQL rewrite. That rewrite only exists for run-ast
 * queries, so a transform paired with it can't be hoisted here.
 *
 * A no-op for every dialect that doesn't override `prepBindings`.
 */
export function applyDialectBindings(database: Knex): void {
	const helper = getHelpers(database).schema;
	const client = database.client as Knex.Client;
	const prepBindings = client.prepBindings.bind(client);

	client.prepBindings = (bindings: unknown) => helper.prepBindings(prepBindings(bindings));
}
