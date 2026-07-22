import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import type { ImportBatchResult } from '../../sync/contract.js';
import { emptyImportSummary, type ImportSummary, summarizeDiff } from '../../sync/render.js';
import { type DataPreviewResult, previewData } from './data-push.js';
import { localDiff } from './local-diff.js';
import { dryRunImport, type Mode, resolveMode, schemaDiffMode } from './push.js';
import { resolveTarget } from './resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	/**
	 * No commander default: an absent flag resolves to the project config's mode, then merge — the exact
	 * precedence push uses, so the diff previews precisely what that push would do.
	 */
	readonly mode?: 'add' | 'merge' | 'mirror';
	readonly project: string;
}

// The --json `data` block: always present so a consumer never guesses whether the data phase was previewed.
// Skipped carries null-ish fields; a real preview carries the mode, the source, the dry-run response's
// per-collection detail verbatim ({} when the batch had nothing to send and the dry-run was skipped), and
// the reconcile tally. Read-only — no map was written to produce it.
interface DiffDataReport {
	mode: Mode;
	source: string | null;
	collections: ImportBatchResult['collections'] | null;
	matched: number | null;
	ambiguous: number | null;
	unmatched: number | null;
	unchanged: number | null;
	skipped: boolean;
}

function dataReport(mode: Mode, preview: DataPreviewResult, dryRun: ImportBatchResult | undefined): DiffDataReport {
	if (preview.skipped) {
		return {
			mode,
			source: null,
			collections: null,
			matched: null,
			ambiguous: null,
			unmatched: null,
			unchanged: null,
			skipped: true,
		};
	}

	return {
		mode,
		source: preview.source,
		collections: dryRun?.collections ?? {},
		matched: preview.matchedCount,
		ambiguous: preview.ambiguousCount,
		unmatched: preview.unmatchedCount,
		unchanged: preview.unchangedCount,
		skipped: false,
	};
}

export async function diff(options: DiffOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, ctx, options.project);
	const { url } = target;

	const mode: Mode = resolveMode(options.mode, target.projectConfig);

	const result = await localDiff(target, schemaDiffMode(mode));

	// diff IS the preview command, so it always pays the data dry-run when data is present: the plan shows
	// the real created/updated/deleted the import would produce, rolled back server-side. previewData is
	// read-only (unambiguous matches applied in memory only), so nothing on disk changed to reach here.
	const preview = await previewData(target, mode);

	let dryRun: ImportBatchResult | undefined;
	let dataSummary: ImportSummary | undefined;

	if (!preview.skipped) {
		// An empty batch (every record proven already right on the target) has nothing to dry-run: the
		// summary is the explicit zero, not a wire call.
		if (preview.records === 0) {
			dataSummary = emptyImportSummary();
		} else {
			const dry = await dryRunImport(target.credential, preview.batch, mode, preview.unchanged);
			dryRun = dry.result;
			dataSummary = dry.summary;
		}
	}

	const schema = summarizeDiff(result === null ? null : result.diff);

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
		ctx.ui.info(`${count(schemaTotal, 'schema change')} between the local snapshot and ${url}:`);

		for (const line of schema.lines) ctx.ui.print(line);
	}

	if (dataSummary !== undefined) {
		// An all-zero plan is stated plainly — never a "data changes" header over a "no data changes" line.
		// Reached only when the schema differs; a no-op on both fronts took the early return above.
		if (dataChanged) {
			ctx.ui.info(`data changes to import to ${url}:`);
			for (const line of dataSummary.lines) ctx.ui.print(line);
		} else {
			ctx.ui.info('no data changes to import.');
		}
	}

	// Records with no target match are REPORTED, never resolved — diff never writes the map. N counts every
	// source still awaiting a match (ambiguous + unmatched); the parenthetical names how many are ambiguous
	// (a choice only an interactive push can make) and appears only when there are any.
	if (!preview.skipped) {
		const pending = preview.ambiguousCount + preview.unmatchedCount;

		if (pending > 0) {
			const detail =
				preview.ambiguousCount > 0 ? ` (${preview.ambiguousCount} ambiguous need interactive resolution)` : '';

			ctx.ui.info(`${count(pending, 'record')} have no target match yet — the first push will reconcile${detail}.`);
		}
	}
}
