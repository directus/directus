import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import type { ProjectConfig } from '../../../kernel/config/file.js';
import type { ImportMode, SchemaDiffMode, SyncMode } from '../../../kernel/config/mode.js';
import { refreshSessionIfNeeded } from '../../../kernel/connection.js';
import type { CliContext } from '../../../kernel/run.js';
import { maybePluralize } from '../../../kernel/text.js';
import { importBatch } from './api.js';
import { ARTIFACT_MANIFEST_FILE } from './artifact-store.js';
import type { SystemSent, UnchangedRows } from './batch.js';
import type { DiffResult, ImportBatchResult, ImportCollectionData } from './contract.js';
import { assertSyncPreflight } from './preflight.js';
import { hasImportChanges, type ImportSummary, summarizeDiff, summarizeImport } from './render.js';
import { displayProjectPath, type Target } from './resolve-target.js';
import { fetchSnapshotDiff } from './snapshot-diff.js';
import { readSnapshotFiles } from './store.js';

export type SyncCommand = 'diff' | 'push';

export function resolveMode(flag: SyncMode | undefined, projectConfig: ProjectConfig | undefined): SyncMode {
	return flag ?? projectConfig?.mode ?? 'merge';
}

function schemaDiffMode(mode: SyncMode): SchemaDiffMode {
	return mode === 'mirror' ? 'mirror' : 'merge';
}

/** Mirror is a merge that carries deletion consent; the import endpoint has no mirror of its own. */
export function dataImportOptions(mode: SyncMode): { mode: ImportMode; dangerouslyAllowDelete?: boolean } {
	if (mode === 'add') return { mode: 'add' };
	if (mode === 'mirror') return { mode: 'merge', dangerouslyAllowDelete: true };
	return { mode: 'merge' };
}

/** Mirror never converges from record count alone: an empty collection entry can still delete records. */
export function dataPhaseConverged(records: number | undefined, mode: SyncMode): boolean {
	return records === undefined || (records === 0 && mode !== 'mirror');
}

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
 * The allocator only steers around rows its list read returned, and a target can hide rows (unlicensed
 * instances hide custom-rule permissions), so the dry run is the first place a squatted key shows.
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

export function claimedKeyLines(claimed: readonly ClaimedTemporaryKey[]): string[] {
	return claimed.map(
		(key) => `${key.collection}: source ${key.sourceId} — temporary key ${key.sentPk} is already a target record`,
	);
}

export interface SchemaPlan {
	/** null when the target already matches the stored snapshot, or when the phase is disabled. */
	readonly result: DiffResult | null;
	/** False under `"schema": false` — a phase that never ran is not a match. */
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

export async function planSchema(target: Target, options: SchemaPlanOptions, ctx: CliContext): Promise<SchemaPlan> {
	const { command, mode, allowDrift } = options;
	const { credential, projectConfig, schemaDir } = target;

	const enabled = projectConfig?.schema !== false;

	if (!enabled && existsSync(join(schemaDir, ARTIFACT_MANIFEST_FILE))) {
		ctx.ui.warn(
			`Schema files exist in ${displayProjectPath(ctx.cwd, target.projectDir)}/schema but this project sets "schema": false — the schema phase is skipped and those files are ignored.`,
		);
	}

	// Read the stored snapshot first so a never-pulled project fails without a session roundtrip.
	const snapshot = enabled ? readSnapshotFiles(schemaDir) : null;

	await refreshSessionIfNeeded(credential);
	const targetVersion = await assertSyncPreflight(credential, target.profile, (message) => ctx.ui.warn(message));

	const result =
		snapshot === null
			? null
			: await fetchSnapshotDiff(
					target,
					snapshot,
					{ mode: schemaDiffMode(mode), command, allowDrift, targetVersion },
					ctx,
				);

	const summary = summarizeDiff(result === null ? null : result.diff);

	return { result, enabled, ...summary, total: summary.added + summary.modified + summary.deleted };
}

const CONVERGED_COPY: Record<SyncCommand, { verdict: string; outcome: string }> = {
	diff: { verdict: 'matches', outcome: 'nothing to do' },
	push: { verdict: 'already matches', outcome: 'nothing to push' },
};

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

export function renderSchemaPlan(plan: SchemaPlan, ctx: CliContext): void {
	if (plan.result !== null) {
		ctx.ui.info(
			`Schema — ${maybePluralize(plan.total, 'change')}: ${plan.added} added, ${plan.modified} modified, ${plan.deleted} deleted`,
		);

		for (const line of plan.lines) ctx.ui.plan(line);
	} else if (!plan.enabled) {
		ctx.ui.info('Schema — skipped ("schema": false in the project configuration).');
	}
}

export interface BatchSize {
	readonly records: number;
	readonly collections: number;
}

/** `summary` is a priced dry run; a non-interactive push has none and can only state the size it sends. */
export function renderDataPlan(
	summary: ImportSummary | undefined,
	batch: BatchSize | undefined,
	ctx: CliContext,
): void {
	if (summary === undefined) {
		if (batch !== undefined && batch.records > 0) {
			ctx.ui.info(
				`Configuration — ${maybePluralize(batch.records, 'record')} across ${maybePluralize(batch.collections, 'collection')} to push.`,
			);
		}

		return;
	}

	if (hasImportChanges(summary)) {
		const total = summary.created + summary.updated + summary.deleted;

		ctx.ui.info(
			`Configuration — ${maybePluralize(total, 'change')}: ${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted`,
		);

		for (const line of summary.lines) ctx.ui.plan(line);
		return;
	}

	ctx.ui.info('Configuration — no changes to push.');
}

/** Not a partition: existing ID-map entries and resources without a natural key fall outside these counts. */
export interface ReconciliationCounts {
	readonly matched: number;
	readonly unmatched: number;
	readonly ambiguous: number;
	readonly dependent: number;
}

/** `unchanged` sits outside reconciliation: it is a content state, not a match state. */
export interface DataComparisonCounts {
	readonly reconciliation: ReconciliationCounts;
	readonly unchanged: number;
}

export interface ReportedPlan {
	readonly source: string;
	readonly incomplete: readonly string[];
}

/** A phase that never ran reports `data: null`, never zeros. `reconciliation` and `unchanged` are diff-only. */
export interface DataReport {
	readonly mode: SyncMode;
	readonly source: string;
	readonly resultsByCollection: ImportBatchResult['collections'];
	readonly reconciliation: ReconciliationCounts | null;
	readonly unchanged: number | null;
	readonly incomplete: string[];
}

/** Key order here is the emitted JSON's key order, and that JSON is a published contract. */
export function dataReport(
	mode: SyncMode,
	plan: ReportedPlan | undefined,
	result: ImportBatchResult | undefined,
	counts?: DataComparisonCounts,
): DataReport | null {
	if (plan === undefined) return null;

	return {
		mode,
		source: plan.source,
		resultsByCollection: result?.collections ?? {},
		reconciliation: counts?.reconciliation ?? null,
		unchanged: counts?.unchanged ?? null,
		incomplete: [...plan.incomplete],
	};
}
