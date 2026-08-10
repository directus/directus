import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import type { ProjectConfig } from '../../../kernel/config/file.js';
import type { ImportMode, SchemaDiffMode, SyncMode } from '../../../kernel/config/mode.js';
import { refreshSessionIfNeeded } from '../../../kernel/connection.js';
import type { CliContext } from '../../../kernel/run.js';
import { count } from '../../../kernel/text.js';
import { importBatch } from './api.js';
import { METADATA_FILE } from './artifact-store.js';
import type { SystemSent, UnchangedRows } from './batch.js';
import type { DiffResult, ImportBatchResult, ImportCollectionData } from './contract.js';
import { hasImportChanges, type ImportSummary, summarizeDiff, summarizeImport } from './render.js';
import { displayProjectPath, type Target } from './resolve-target.js';
import { fetchSnapshotDiff } from './snapshot-diff.js';
import { readSnapshotFiles } from './store.js';

/** The two commands built on this plan. They differ only in the wording of their no-op sentence. */
export type SyncCommand = 'diff' | 'push';

/**
 * Resolve flag over project configuration over additive merge, so deletions are never the default.
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
 * collection entry can still delete target records.
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

/** A temporary key the dry run matched to a real target record. */
export interface ClaimedTemporaryKey {
	readonly collection: string;
	readonly sourceId: string;
	readonly sentPk: string;
}

/**
 * Temporary keys the import would treat as updates of real target records. The allocator only steers
 * around rows its list read returned, and a target can hide rows from lists (unlicensed instances hide
 * custom-rule permissions), so the dry run is the first place a squatted key becomes visible. Only the
 * paths that dry-run get this check; a non-interactive push skips the dry-run transaction and relies on
 * the post-import guard in `recordImportedIds`.
 */
export function claimedTemporaryKeys(
	result: ImportBatchResult,
	systemSent: readonly SystemSent[],
): ClaimedTemporaryKey[] {
	const claimed: ClaimedTemporaryKey[] = [];

	for (const { collection, records } of systemSent) {
		const existing = result.collections[collection]?.existing;

		if (existing === undefined || existing.length === 0) continue;

		const pks = new Set(existing.map((pk) => String(pk)));

		for (const { sourceId, sentPk, temporary } of records) {
			if (temporary && pks.has(sentPk)) claimed.push({ collection, sourceId, sentPk });
		}
	}

	return claimed;
}

/** Name the claimed records. Shared so the diff preview and the push refusal cannot describe them differently. */
export function claimedKeyLines(claimed: readonly ClaimedTemporaryKey[]): string[] {
	return claimed.map(
		(key) => `${key.collection}: source ${key.sourceId} — temporary key ${key.sentPk} is already a target record`,
	);
}

/** The schema half of a sync plan: what the target would change, and whether the phase ran at all. */
export interface SchemaPlan {
	/** null when the target already matches the stored snapshot, or when the phase is disabled. */
	readonly result: DiffResult | null;
	/** False under `"schema": false`; the phase never ran, so it must never be reported as a match. */
	readonly enabled: boolean;
	readonly added: number;
	readonly modified: number;
	readonly deleted: number;
	readonly total: number;
	readonly lines: readonly string[];
}

export interface SchemaPlanOptions {
	readonly command: SyncCommand;
	readonly mode: SyncMode;
	readonly allowDrift: boolean;
}

/**
 * Build the schema plan both sync commands work from. Diff must not preview what push refuses, so the
 * compatibility gate, the disabled-phase disclosure, and the snapshot being compared are decided in one place.
 */
export async function planSchema(target: Target, options: SchemaPlanOptions, ctx: CliContext): Promise<SchemaPlan> {
	const { command, mode, allowDrift } = options;
	const { credential, projectConfig, schemaDir } = target;

	// A disabled schema phase carries no version gate and must not be reported as a match.
	const enabled = projectConfig?.schema !== false;

	if (!enabled && existsSync(join(schemaDir, METADATA_FILE))) {
		ctx.ui.warn(
			`Schema files exist in ${displayProjectPath(ctx.cwd, target.projectDir)}/schema but this project sets "schema": false — the schema phase is skipped and those files are ignored.`,
		);
	}

	// Read the stored snapshot first so a never-pulled project fails without a session roundtrip.
	const snapshot = enabled ? readSnapshotFiles(schemaDir) : null;

	await refreshSessionIfNeeded(credential);

	const result =
		snapshot === null
			? null
			: await fetchSnapshotDiff(target, snapshot, { mode: schemaDiffMode(mode), command, allowDrift }, ctx);

	const summary = summarizeDiff(result === null ? null : result.diff);

	return { result, enabled, ...summary, total: summary.added + summary.modified + summary.deleted };
}

const CONVERGED_COPY: Record<SyncCommand, { verdict: string; outcome: string }> = {
	diff: { verdict: 'matches', outcome: 'nothing to do' },
	push: { verdict: 'already matches', outcome: 'nothing to push' },
};

/**
 * The sentence for a target that needs no changes. Only a phase that actually ran may be named as
 * matching: a `"schema": false` project compared no schema, and a project with no stored data
 * compared no data, so neither may read as "schema and data match".
 */
export function convergedMessage(
	command: SyncCommand,
	target: Target,
	cwd: string,
	plan: SchemaPlan,
	dataChecked: boolean,
): string {
	const { verdict, outcome } = CONVERGED_COPY[command];
	const subject = `${target.profile} — ${target.url}`;
	const projectPath = displayProjectPath(cwd, target.projectDir);

	if (!dataChecked) return `${subject} ${verdict} ${projectPath} — ${outcome}.`;

	return plan.enabled
		? `${subject} ${verdict} ${projectPath} — schema and configuration match; ${outcome}.`
		: `${subject} ${verdict} ${projectPath} — configuration matches; ${outcome} (schema phase skipped).`;
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
		ctx.ui.info('Schema — skipped ("schema": false in the project configuration).');
	}
}

/** How much a batch will send, for a plan that has no priced dry run to show instead. */
export interface BatchSize {
	readonly records: number;
	readonly collections: number;
}

/**
 * Render the user-facing configuration section of a data plan. `summary` is a priced dry run; a non-interactive push has none
 * because it skips the dry-run transaction, so it can only state the size of what it will send.
 */
export function renderDataPlan(
	summary: ImportSummary | undefined,
	batch: BatchSize | undefined,
	ctx: CliContext,
): void {
	if (summary === undefined) {
		if (batch !== undefined && batch.records > 0) {
			ctx.ui.info(
				`Configuration — ${count(batch.records, 'record')} across ${count(batch.collections, 'collection')} to push.`,
			);
		}

		return;
	}

	if (hasImportChanges(summary)) {
		const total = summary.created + summary.updated + summary.deleted;

		ctx.ui.info(
			`Configuration — ${count(total, 'change')}: ${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted`,
		);

		for (const line of summary.lines) ctx.ui.plan(line);
		return;
	}

	ctx.ui.info('Configuration — no changes to push.');
}

/**
 * What the diff's natural-key reconciliation found. Existing ID-map entries and resources without natural
 * keys are outside these counts, so they are not an exhaustive partition of stored records.
 */
export interface ReconciliationCounts {
	readonly matched: number;
	readonly unmatched: number;
	readonly ambiguous: number;
	readonly dependent: number;
}

/** Diff-only comparison counts; unchanged is a content state, not a reconciliation state. */
export interface DataComparisonCounts {
	readonly reconciliation: ReconciliationCounts;
	readonly unchanged: number;
}

/** The report-facing surface a push plan and a diff preview share. */
export interface ReportedPlan {
	readonly source: string;
	readonly incomplete: readonly string[];
}

/**
 * The data half of a machine report. A phase that never ran reports nulls and `skipped: true`, never
 * zeros: a consumer must never read "no data was compared" as "the data matched".
 */
export interface DataReport {
	readonly mode: SyncMode;
	readonly source: string | null;
	readonly resultsByCollection: ImportBatchResult['collections'] | null;
	readonly reconciliation: ReconciliationCounts | null;
	readonly unchanged: number | null;
	readonly incomplete: string[] | null;
	readonly skipped: boolean;
}

/**
 * Build the data report. Key insertion order is the emitted JSON's key order, and both commands'
 * payloads are published contracts — comparison details belong between `resultsByCollection` and
 * `incomplete`, not appended.
 */
export function dataReport(
	mode: SyncMode,
	plan: ReportedPlan | undefined,
	result: ImportBatchResult | undefined,
	counts?: DataComparisonCounts,
): DataReport {
	if (plan === undefined) {
		return {
			mode,
			source: null,
			resultsByCollection: null,
			reconciliation: null,
			unchanged: null,
			incomplete: null,
			skipped: true,
		};
	}

	return {
		mode,
		source: plan.source,
		resultsByCollection: result?.collections ?? {},
		reconciliation: counts?.reconciliation ?? null,
		unchanged: counts?.unchanged ?? null,
		incomplete: [...plan.incomplete],
		skipped: false,
	};
}
