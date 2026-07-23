import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import type { ImportBatchResult } from '../../sync/contract.js';
import { describeMode, type Mode } from '../../sync/mode.js';
import { emptyImportSummary, hasImportChanges, type ImportSummary, summarizeDiff } from '../../sync/render.js';
import { type DataPreviewResult, previewData } from './data-push.js';
import { localDiff } from './local-diff.js';
import { dataPhaseConverged, dryRunImport, resolveMode, schemaDiffMode } from './push.js';
import { resolveTarget } from './resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	/**
	 * No commander default: an absent flag resolves to the project config's mode, then merge — the same
	 * precedence push uses.
	 */
	readonly mode?: Mode;
	readonly project: string;
}

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

	// Same disclosure as push: which instance, and what the mode would mean — BEFORE any results, so an
	// operator diffing the wrong profile notices here, not in the push that follows.
	ctx.ui.info(`Comparing committed files with ${options.to} — ${url} (${describeMode(mode)})`);

	const result = await localDiff(target, schemaDiffMode(mode));

	// This is conservative when identities are ambiguous: diff never prompts or writes the ID map, while an
	// interactive push may resolve those identities before importing.
	const preview = await previewData(target, mode);

	let dryRun: ImportBatchResult | undefined;
	let dataSummary: ImportSummary | undefined;

	if (!preview.skipped) {
		// Mirror always dry-runs because an empty collection entry can still delete target rows.
		if (dataPhaseConverged(preview, mode)) {
			dataSummary = emptyImportSummary();
		} else {
			const dry = await dryRunImport(target.credential, preview.batch, mode, preview.unchanged);
			dryRun = dry.result;
			dataSummary = dry.summary;
		}
	}

	const schema = summarizeDiff(result === null ? null : result.diff);

	const schemaTotal = schema.added + schema.modified + schema.deleted;

	const dataChanged = dataSummary !== undefined && hasImportChanges(dataSummary);

	if (ctx.ui.json) {
		// The hash lets a later apply detect target-schema drift.
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

	if (result === null && !dataChanged) {
		const tail = preview.skipped ? 'nothing to do.' : 'schema and data match; nothing to do.';
		ctx.ui.success(`${options.to} matches the local snapshot — ${tail}`);
		return;
	}

	if (result !== null) {
		ctx.ui.info(
			`Schema — ${count(schemaTotal, 'change')}: ${schema.added} added, ${schema.modified} modified, ${schema.deleted} deleted`,
		);

		for (const line of schema.lines) ctx.ui.plan(line);
	}

	if (dataSummary !== undefined) {
		if (dataChanged) {
			const total = dataSummary.created + dataSummary.updated + dataSummary.deleted;

			ctx.ui.info(
				`Data — ${count(total, 'change')}: ${dataSummary.created} created, ${dataSummary.updated} updated, ${dataSummary.deleted} deleted`,
			);

			for (const line of dataSummary.lines) ctx.ui.plan(line);
		} else {
			ctx.ui.info('Data — no changes to import.');
		}
	}

	// Diff reports unresolved identities but leaves every choice for an interactive push.
	if (!preview.skipped) {
		const pending = preview.ambiguousCount + preview.unmatchedCount;

		if (pending > 0) {
			const detail =
				preview.ambiguousCount > 0
					? ` (${preview.ambiguousCount} ambiguous — run push in a terminal to choose the match)`
					: '';

			ctx.ui.info(
				`${count(pending, 'committed record')} ${pending === 1 ? 'has' : 'have'} no target match yet — the first push will match or create them${detail}.`,
			);
		}
	}
}
