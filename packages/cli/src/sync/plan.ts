import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import type { ProjectConfig } from '../kernel/config/file.js';
import { refreshSessionIfNeeded } from '../kernel/connection.js';
import type { CliContext } from '../kernel/run.js';
import { count } from '../kernel/text.js';
import { importBatch } from './api.js';
import { METADATA_FILE } from './artifact-store.js';
import type { DiffResult, ImportBatchResult, ImportCollectionData } from './contract.js';
import type { UnchangedRows } from './data-push.js';
import type { ImportMode, SchemaDiffMode, SyncMode } from './mode.js';
import { hasImportChanges, type ImportSummary, summarizeDiff, summarizeImport } from './render.js';
import type { Target } from './resolve-target.js';
import { fetchSnapshotDiff } from './snapshot-diff.js';
import { readSnapshotFiles } from './store.js';

/** The two commands built on this plan. They differ only in the wording of their no-op sentence. */
export type SyncCommand = 'diff' | 'push';

/**
 * Resolve flag over project config over additive merge, so deletions are never the default.
 */
export function resolveMode(flag: SyncMode | undefined, projectConfig: ProjectConfig | undefined): SyncMode {
	return flag ?? projectConfig?.mode ?? 'merge';
}

function schemaDiffMode(mode: SyncMode): SchemaDiffMode {
	return mode === 'mirror' ? 'mirror' : 'merge';
}

/** Map a user-facing mode to import parameters. Mirror is a merge that carries deletion consent. */
export function dataImportOptions(mode: SyncMode): { mode: ImportMode; dangerouslyAllowDelete?: boolean } {
	if (mode === 'add') return { mode: 'add' };
	if (mode === 'mirror') return { mode: 'merge', dangerouslyAllowDelete: true };
	return { mode: 'merge' };
}

/**
 * Whether the data phase is done. Mirror never converges from record count alone because an empty
 * collection entry can still delete target rows.
 */
export function dataPhaseConverged(records: number | undefined, mode: SyncMode): boolean {
	return records === undefined || (records === 0 && mode !== 'mirror');
}

/**
 * Execute and roll back a data import, returning both its wire result and rendered summary.
 */
export async function dryRunImport(
	credential: ResolvedCredential,
	batch: ImportCollectionData[],
	mode: SyncMode,
	unchanged?: UnchangedRows,
): Promise<{ result: ImportBatchResult; summary: ImportSummary }> {
	const result = await importBatch(credential, batch, { ...dataImportOptions(mode), dryRun: true });
	return { result, summary: summarizeImport(result, unchanged) };
}

/** The schema half of a sync plan: what the target would change, and whether the phase ran at all. */
export interface SchemaPlan {
	/** null when the target already matches the committed snapshot, or when the phase is disabled. */
	readonly result: DiffResult | null;
	/** False under `"schema": false`; the phase never ran, so it must never be reported as a match. */
	readonly enabled: boolean;
	readonly added: number;
	readonly modified: number;
	readonly deleted: number;
	readonly total: number;
	readonly lines: readonly string[];
}

/**
 * Build the schema plan both sync commands work from. Diff must not preview what push refuses, so the
 * version gate, the disabled-phase disclosure, and the snapshot being compared are decided in one place.
 */
export async function planSchema(
	target: Target,
	mode: SyncMode,
	allowVersionDrift: boolean,
	ctx: CliContext,
): Promise<SchemaPlan> {
	const { credential, projectConfig, schemaDir } = target;

	// A disabled schema phase carries no version gate and must not be reported as a match.
	const enabled = projectConfig?.schema !== false;

	if (!enabled && existsSync(join(schemaDir, METADATA_FILE))) {
		ctx.ui.warn(
			'Committed schema files exist but this project sets "schema": false — the schema phase is skipped and those files are ignored.',
		);
	}

	// Read the committed snapshot first so a never-pulled project fails without a session roundtrip.
	const snapshot = enabled ? readSnapshotFiles(schemaDir) : null;

	await refreshSessionIfNeeded(credential);

	const result =
		snapshot === null ? null : await fetchSnapshotDiff(target, snapshot, schemaDiffMode(mode), allowVersionDrift, ctx);

	const summary = summarizeDiff(result === null ? null : result.diff);

	return { result, enabled, ...summary, total: summary.added + summary.modified + summary.deleted };
}

const CONVERGED_COPY: Record<SyncCommand, { verdict: string; outcome: string }> = {
	diff: { verdict: 'matches', outcome: 'nothing to do' },
	push: { verdict: 'already matches', outcome: 'nothing to push' },
};

/**
 * The sentence for a target that needs no changes. Only a phase that actually ran may be named as
 * matching: a `"schema": false` project compared no schema, and a project with no committed data
 * compared no data, so neither may read as "schema and data match".
 */
export function convergedMessage(
	command: SyncCommand,
	profile: string,
	plan: SchemaPlan,
	dataChecked: boolean,
): string {
	const { verdict, outcome } = CONVERGED_COPY[command];

	if (!dataChecked) return `${profile} ${verdict} the committed files — ${outcome}.`;

	return plan.enabled
		? `${profile} ${verdict} the committed files — schema and data match; ${outcome}.`
		: `${profile} ${verdict} the committed files — data matches; ${outcome} (schema phase skipped).`;
}

/**
 * Render the schema section of a plan. A skipped phase says so out loud instead of staying silent,
 * because silence reads as "nothing changed".
 */
export function renderSchemaPlan(plan: SchemaPlan, ctx: CliContext): void {
	if (plan.result !== null) {
		ctx.ui.info(
			`Schema — ${count(plan.total, 'change')}: ${plan.added} added, ${plan.modified} modified, ${plan.deleted} deleted`,
		);

		for (const line of plan.lines) ctx.ui.plan(line);
	} else if (!plan.enabled) {
		ctx.ui.info('Schema — skipped ("schema": false in the project config).');
	}
}

/** How much a batch will send, for a plan that has no priced dry run to show instead. */
export interface BatchSize {
	readonly records: number;
	readonly collections: number;
}

/**
 * Render the data section of a plan. `summary` is a priced dry run; a non-interactive push has none
 * because it skips the dry-run transaction, so it can only state the size of what it will send.
 * `unresolved` counts sources whose target identity is still ambiguous — neither creates nor updates,
 * so they are reported beside the plan rather than inside it.
 */
export function renderDataPlan(
	summary: ImportSummary | undefined,
	unresolved: number,
	batch: BatchSize | undefined,
	ctx: CliContext,
): void {
	if (summary === undefined) {
		if (batch !== undefined && batch.records > 0) {
			ctx.ui.info(
				`Data — ${count(batch.records, 'record')} across ${count(batch.collections, 'collection')} to import.`,
			);
		}

		return;
	}

	if (hasImportChanges(summary)) {
		const total = summary.created + summary.updated + summary.deleted;
		const unresolvedSegment = unresolved > 0 ? `, ${unresolved} unresolved` : '';

		ctx.ui.info(
			`Data — ${count(total, 'change')}: ${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted${unresolvedSegment}`,
		);

		for (const line of summary.lines) ctx.ui.plan(line);
		return;
	}

	if (unresolved > 0) {
		ctx.ui.info(`Data — no changes to import; ${count(unresolved, 'record')} unresolved.`);
		return;
	}

	ctx.ui.info('Data — no changes to import.');
}

/**
 * What identity reconciliation found. Diff-only: a push resolves ambiguity — by prompt or by refusal —
 * rather than counting it, and its report has no such keys.
 */
export interface ReconcileCounts {
	readonly matched: number | null;
	readonly ambiguous: number | null;
	readonly unmatched: number | null;
	readonly unchanged: number | null;
}

/** The report-facing surface a push plan and a diff preview share. */
export interface ReportedPlan {
	readonly source: string;
	readonly incomplete: readonly string[];
}

/**
 * The data half of a machine report. A phase that never ran reports nulls and `skipped: true`, never
 * zeros: a consumer must never be able to read "no data was compared" as "the data matched".
 */
export interface DataReport extends Partial<ReconcileCounts> {
	readonly mode: SyncMode;
	readonly source: string | null;
	readonly collections: ImportBatchResult['collections'] | null;
	readonly incomplete: string[] | null;
	readonly skipped: boolean;
}

/**
 * Build the data report. Key insertion order is the emitted JSON's key order, and both commands'
 * payloads are published contracts — the reconcile counts belong between `collections` and
 * `incomplete`, not appended.
 */
export function dataReport(
	mode: SyncMode,
	plan: ReportedPlan | undefined,
	result: ImportBatchResult | undefined,
	counts?: ReconcileCounts,
): DataReport {
	const counters: Partial<ReconcileCounts> = counts ?? {};

	if (plan === undefined) {
		return { mode, source: null, collections: null, ...counters, incomplete: null, skipped: true };
	}

	return {
		mode,
		source: plan.source,
		collections: result?.collections ?? {},
		...counters,
		incomplete: [...plan.incomplete],
		skipped: false,
	};
}
