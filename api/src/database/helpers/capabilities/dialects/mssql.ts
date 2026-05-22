import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import { CapabilitiesHelperDefault } from './default.js';

const env = useEnv();

export class CapabilitiesHelperMSSQL extends CapabilitiesHelperDefault {
	/**
	 * MSSQL: opt-in via `DB_MSSQL_TRUST_BATCH_RETURNING` (default `false`). Microsoft says
	 * OUTPUT row order isn't guaranteed
	 * (https://learn.microsoft.com/sql/t-sql/queries/output-clause-transact-sql); knex emits
	 * `OUTPUT INSERTED.<col> INTO #out; SELECT … FROM #out` with no `ORDER BY`
	 * (https://github.com/knex/knex/blob/3.2.10/lib/dialects/mssql/query/mssql-querycompiler.js#L358-L381).
	 * Empirically it stays insertion-ordered because OUTPUT into a temp table forces a
	 * serial plan, but that's not contractual. knex's docs list MSSQL as fully supported
	 * and warn only about triggers, silent on ordering
	 * (https://knexjs.org/guide/query-builder.html#returning) — hence the flag: knex says
	 * trust, Microsoft says don't. No SQL Server version, compat level, trace flag, or
	 * `OUTPUT ORDERED` clause unlocks a guarantee; only a knex-side row-number passthrough
	 * would.
	 */
	override async preservesInsertOrderInReturning(): Promise<boolean> {
		return toBoolean(env['DB_MSSQL_TRUST_BATCH_RETURNING']);
	}
}
