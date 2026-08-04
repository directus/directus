import type { Knex } from 'knex';
import { getHelpers } from './helpers/index.js';

/**
 * Marks a client prototype as already composed, so a second connection on the same dialect doesn't
 * stack another copy of the transform on top.
 */
const APPLIED = Symbol.for('directus:dialect-bindings-applied');

/**
 * Compose the dialect's `SchemaHelper.prepBindings` onto the knex client, so a driver that mangles
 * certain binding values can correct them for every query the connection runs.
 *
 * `Client.prepBindings` is the seam for this: it's part of knex's published `Knex.Client` surface,
 * knex's own oracledb dialect overrides it for the same kind of driver quirk, and every query passes
 * through it via `enrichQueryObject`, whether it came from the query builder, from `knex.raw`, or
 * from the schema builder.
 *
 * The transform has to be installed on the client's *prototype*, not on the client instance. knex
 * builds a transaction's client with `Object.create(client.constructor.prototype)` and then copies
 * over only a fixed handful of properties (`config`, `driver`, `connectionSettings`, `logger`, …), so
 * an own property assigned to the outer client is invisible to every query inside a transaction —
 * and every Directus mutation runs in one. Installing on the prototype the transaction client is
 * created from is what makes reads, writes and DDL agree.
 *
 * The captured helper is safe to share across connections on the same prototype: the prototype is
 * the dialect's own class, and `getHelpers` picks the schema helper by dialect too.
 *
 * This is deliberately separate from `prepQueryParamBindings`, which `withPreprocessBindings`
 * applies per query alongside a `prepQueryParams` SQL rewrite. That rewrite only exists for run-ast
 * queries, so a transform paired with it can't be hoisted here.
 *
 * A no-op for every dialect that doesn't override `prepBindings`.
 */
export function applyDialectBindings(database: Knex): void {
	const client = database.client as Knex.Client;
	const prototype = client.constructor.prototype as Knex.Client;

	if (Object.hasOwn(prototype, APPLIED)) return;

	const helper = getHelpers(database).schema;
	const prepBindings = prototype.prepBindings;

	prototype.prepBindings = function (this: Knex.Client, bindings: Knex.Value[]) {
		return helper.prepBindings(prepBindings.call(this, bindings));
	};

	Object.defineProperty(prototype, APPLIED, { value: true });
}
