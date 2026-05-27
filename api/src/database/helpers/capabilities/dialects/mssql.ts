import { useEnv } from '@directus/env';
import { CapabilitiesHelperDefault } from './default.js';

const env = useEnv();

export class CapabilitiesHelperMSSQL extends CapabilitiesHelperDefault {
	/**
	 * MSSQL: opt-in via `DB_MSSQL_TRUST_BATCH_RETURNING` (default `false`).
	 *
	 * - Why the flag exists (Microsoft vs knex disagree on whether OUTPUT order is safe):
	 *   - Microsoft says OUTPUT row order isn't guaranteed
	 *     (https://learn.microsoft.com/sql/t-sql/queries/output-clause-transact-sql).
	 *   - knex emits `OUTPUT INSERTED.<col> INTO #out; SELECT … FROM #out` with no `ORDER BY`
	 *     (https://github.com/knex/knex/blob/3.2.10/lib/dialects/mssql/query/mssql-querycompiler.js#L358-L381).
	 *   - Empirically it stays insertion-ordered because OUTPUT into a temp table forces a
	 *     serial plan, but that's not contractual.
	 *   - knex's docs list MSSQL as fully supported and warn only about triggers, silent
	 *     on ordering (https://knexjs.org/guide/query-builder.html#returning).
	 *   - Hence the flag: knex says trust, Microsoft says don't.
	 *   - No SQL Server version, compat level, trace flag, or `OUTPUT ORDERED` clause
	 *     unlocks a guarantee; only a knex-side row-number passthrough would.
	 *
	 * - Caveat for triggered tables (opting in breaks inserts on tables with triggers):
	 *   - `knex.batchInsert(...).returning(...)` has no signature to thread
	 *     `{ includeTriggerModifications: true }` through (only the per-row
	 *     `.insert().returning()` path does).
	 *   - So the OUTPUT clause is emitted without `INTO`, which SQL Server rejects on any
	 *     table with an enabled trigger.
	 *   - Won't be closed without a knex redesign: maintainers consider
	 *     `batchInsert` a second-class helper that shouldn't gain feature parity
	 *     with `.insert()` (https://github.com/knex/knex/issues/3590 — open;
	 *     `includeTriggerModifications` was added for `.insert().returning()` in
	 *     https://github.com/knex/knex/issues/2446 but never extended to
	 *     `batchInsert`).
	 *   - Keep this flag off for trigger-bearing schemas; the default-false per-row dispatch
	 *     retains trigger support.
	 */
	override async preservesInsertOrderInReturning(): Promise<boolean> {
		return env['DB_MSSQL_TRUST_BATCH_RETURNING'] as boolean;
	}

	/**
	 * MSSQL: tables with enabled triggers reject `OUTPUT INSERTED.<col>` unless the
	 * server is told to redirect OUTPUT into a temp table via knex's
	 * `includeTriggerModifications` option. Apply it on every per-row insert so
	 * triggered tables work transparently.
	 */
	override insertReturningOptions(): { includeTriggerModifications: true } {
		return { includeTriggerModifications: true };
	}
}
