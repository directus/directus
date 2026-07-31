import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { refreshSessionIfNeeded } from '../../kernel/connection.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import { METADATA_FILE } from '../../sync/artifact-store.js';
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
	/** The server's own sanctioned bypass of its exact-version/vendor gate on /schema/diff, made explicit. */
	readonly allowVersionDrift?: boolean;
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
	/** Collections the committed manifest marks as truncated; push refuses mirror while any are present. */
	incomplete: string[] | null;
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
			incomplete: null,
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
		incomplete: [...preview.incomplete],
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

	await refreshSessionIfNeeded(target.credential);

	// schema: false is an explicit project state — the diff previews exactly the push, and that push
	// carries no schema authority for this project.
	const schemaEnabled = target.projectConfig?.schema !== false;

	if (!schemaEnabled && existsSync(join(target.schemaDir, METADATA_FILE))) {
		ctx.ui.warn(
			'Committed schema files exist but this project sets "schema": false — the schema phase is skipped and those files are ignored.',
		);
	}

	const result = schemaEnabled
		? await localDiff(target, schemaDiffMode(mode), ctx, options.allowVersionDrift ?? false)
		: null;

	// This is conservative when identities are ambiguous: diff never prompts or writes the ID map, while an
	// interactive push may resolve those identities before importing.
	const preview = await previewData(target, mode);

	// Diff stays read-only, so it shows the mirror consequences but names the lie: deletions counted below
	// include rows the source hid at pull time, and push will refuse this mirror outright.
	if (mode === 'mirror' && !preview.skipped && preview.incomplete.length > 0) {
		ctx.ui.warn(
			`The committed export is incomplete for ${preview.incomplete.join(', ')} — the source hid rows from reads at pull time, and push will refuse mirror. Push with --mode merge, or license the source and re-pull.`,
		);
	}

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

	// Ambiguous sources are excluded from the preview batch (they are not creates: an interactive push may
	// resolve them into updates, a non-interactive push refuses), so they surface as their own count.
	const unresolved = preview.skipped ? 0 : preview.ambiguousCount;

	if (ctx.ui.json) {
		// The hash lets a later apply detect target-schema drift. Unresolved identities count as changes:
		// an all-ambiguous data set is NOT convergence — a non-interactive push refuses it — and a CI gate
		// reading changes:false would report "in sync" about a state push cannot apply.
		ctx.ui.data({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project: target.project,
			mode,
			changes: result !== null || dataChanged || unresolved > 0,
			unresolved,
			schemaSkipped: !schemaEnabled,
			added: schema.added,
			modified: schema.modified,
			deleted: schema.deleted,
			hash: result?.hash ?? null,
			data: dataReport(mode, preview, dryRun),
		});

		return;
	}

	// An all-ambiguous data set produces a zero dry-run, but "nothing to do" would hide that push still
	// prompts (interactive) or refuses (CI) — fall through so the unresolved count and note render.
	if (result === null && !dataChanged && unresolved === 0) {
		// A skipped schema phase must never read as "schemas match" — this project never compared them.
		let tail = 'nothing to do.';

		if (!preview.skipped) {
			tail = schemaEnabled
				? 'schema and data match; nothing to do.'
				: 'data matches; nothing to do (schema phase skipped).';
		}

		ctx.ui.success(`${options.to} matches the committed files — ${tail}`);
		return;
	}

	if (result !== null) {
		ctx.ui.info(
			`Schema — ${count(schemaTotal, 'change')}: ${schema.added} added, ${schema.modified} modified, ${schema.deleted} deleted`,
		);

		for (const line of schema.lines) ctx.ui.plan(line);
	} else if (!schemaEnabled) {
		ctx.ui.info('Schema — skipped ("schema": false in the project config).');
	}

	if (dataSummary !== undefined) {
		if (dataChanged) {
			const total = dataSummary.created + dataSummary.updated + dataSummary.deleted;
			const unresolvedSegment = unresolved > 0 ? `, ${unresolved} unresolved` : '';

			ctx.ui.info(
				`Data — ${count(total, 'change')}: ${dataSummary.created} created, ${dataSummary.updated} updated, ${dataSummary.deleted} deleted${unresolvedSegment}`,
			);

			for (const line of dataSummary.lines) ctx.ui.plan(line);
		} else if (unresolved > 0) {
			ctx.ui.info(`Data — no changes to import; ${count(unresolved, 'record')} unresolved.`);
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
					? ` (${preview.ambiguousCount} ambiguous — run push in a terminal to choose the match; a non-interactive push refuses until they are resolved)`
					: '';

			ctx.ui.info(
				`${count(pending, 'committed record')} ${pending === 1 ? 'has' : 'have'} no target match yet — the first push will match or create them${detail}.`,
			);
		}
	}
}
