import type { CliContext } from '../../kernel/run.js';
import { importBatch } from '../../sync/api.js';
import type { ImportBatchResult } from '../../sync/contract.js';
import { type ImportSummary, summarizeDiff, summarizeImport } from '../../sync/render.js';
import { type DataPreviewResult, previewData } from './data-push.js';
import { localDiff } from './local-diff.js';
import { dataImportOptions, type Mode, schemaDiffMode } from './push.js';
import { resolveTarget } from './resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	// No commander default: an absent flag resolves to the project config's mode, then merge — the exact
	// precedence push uses, so the diff previews precisely what that push would do.
	readonly mode?: 'add' | 'merge' | 'mirror';
	readonly project: string;
}

// The --json `data` block: always present so a consumer never guesses whether the data phase was previewed.
// Skipped carries null-ish fields; a real preview carries the mode, the source, the dry-run response's
// per-collection detail verbatim, and the reconcile tally. Read-only — no map was written to produce it.
function dataReport(
	mode: Mode,
	preview: DataPreviewResult,
	dryRun: ImportBatchResult | undefined,
): {
	mode: Mode;
	source: string | null;
	collections: ImportBatchResult['collections'] | null;
	matched: number | null;
	ambiguous: number | null;
	unmatched: number | null;
	skipped: boolean;
} {
	if (preview.skipped || dryRun === undefined) {
		return { mode, source: null, collections: null, matched: null, ambiguous: null, unmatched: null, skipped: true };
	}

	return {
		mode,
		source: preview.source,
		collections: dryRun.collections,
		matched: preview.matchedCount,
		ambiguous: preview.ambiguousCount,
		unmatched: preview.unmatchedCount,
		skipped: false,
	};
}

export async function diff(options: DiffOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, ctx, options.project);
	const { url } = target;

	// Precedence identical to push: an explicit flag wins, else the project config's mode, else additive
	// merge — so the preview reflects exactly the push the operator would run.
	const mode: Mode = options.mode ?? target.projectConfig?.mode ?? 'merge';

	const { result } = await localDiff(target, schemaDiffMode(mode));

	// diff IS the preview command, so it always pays the data dry-run when data is present: the plan shows
	// the real created/updated/deleted the import would produce, rolled back server-side. previewData is
	// read-only (unambiguous matches applied in memory only), so nothing on disk changed to reach here.
	const preview = await previewData(target);

	let dryRun: ImportBatchResult | undefined;
	let dataSummary: ImportSummary | undefined;

	if (!preview.skipped) {
		dryRun = await importBatch(target.credential, preview.batch, { ...dataImportOptions(mode), dryRun: true });
		dataSummary = summarizeImport(dryRun);
	}

	const schema =
		result === null ? { added: 0, modified: 0, deleted: 0, lines: [] as string[] } : summarizeDiff(result.diff);

	const schemaTotal = schema.added + schema.modified + schema.deleted;

	const dataChanged =
		dataSummary !== undefined && (dataSummary.created > 0 || dataSummary.updated > 0 || dataSummary.deleted > 0);

	if (ctx.ui.json) {
		// hash travels with the machine payload: apply seals against this diff and CI may persist it. The
		// schema fields keep their pre-data meaning (backward compat); `data` carries the new preview, and
		// `changes` widens to the honest overall answer (schema OR data).
		ctx.ui.data({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project: target.project,
			mode,
			changes: result !== null || dataChanged,
			added: schema.added,
			modified: schema.modified,
			deleted: schema.deleted,
			hash: result?.hash ?? null,
			data: dataReport(mode, preview, dryRun),
		});

		return;
	}

	// A no-op is the command's answer, not a failure: the schema matches and the data phase either was
	// skipped or dry-ran to an all-zero plan. Keep the original copy when data was skipped; extend it
	// naturally when data was actually checked and also matched.
	if (result === null && !dataChanged) {
		const tail = preview.skipped ? 'nothing to do.' : 'schema and data match; nothing to do.';
		ctx.ui.success(`${options.to} matches the local snapshot — ${tail}`);
		return;
	}

	if (result !== null) {
		ctx.ui.info(
			`${schemaTotal} schema ${schemaTotal === 1 ? 'change' : 'changes'} between the local snapshot and ${url}:`,
		);

		for (const line of schema.lines) ctx.ui.print(line);
	}

	if (dataSummary !== undefined) {
		ctx.ui.info(`data changes to import to ${url}:`);
		for (const line of dataSummary.lines) ctx.ui.print(line);
	}

	// Records with no target match are REPORTED, never resolved — diff never writes the map. N counts every
	// source still awaiting a match (ambiguous + unmatched); the parenthetical names how many are ambiguous
	// (a choice only an interactive push can make) and appears only when there are any.
	if (!preview.skipped) {
		const pending = preview.ambiguousCount + preview.unmatchedCount;

		if (pending > 0) {
			const detail =
				preview.ambiguousCount > 0 ? ` (${preview.ambiguousCount} ambiguous need interactive resolution)` : '';

			ctx.ui.info(
				`${pending} record${pending === 1 ? '' : 's'} have no target match yet — the first push will reconcile${detail}.`,
			);
		}
	}
}
