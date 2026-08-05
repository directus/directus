import { type Command, Option } from 'commander';
import { describeMode, MODES, type SyncMode } from '../../kernel/config/mode.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import type { ImportBatchResult } from './utils/contract.js';
import { type DataPreviewPlan, previewData } from './utils/data-push.js';
import {
	convergedMessage,
	dataPhaseConverged,
	dataReport,
	dryRunImport,
	planSchema,
	type ReconcileCounts,
	renderDataPlan,
	renderSchemaPlan,
	resolveMode,
} from './utils/plan.js';
import { emptyImportSummary, hasImportChanges, type ImportSummary } from './utils/render.js';
import { resolveTarget } from './utils/resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	/**
	 * No commander default: an absent flag resolves to the project configuration's mode, then merge — the same
	 * precedence push uses.
	 */
	readonly mode?: SyncMode;
	/** The server's own sanctioned bypass of its exact-version/vendor gate on /schema/diff, made explicit. */
	readonly allowVersionDrift?: boolean;
	readonly project: string;
}

export function registerDiff(command: Command, getContext: () => CliContext): void {
	command
		.command('diff')
		.description('Show what a push would change on the target. Applies nothing')
		.requiredOption('--to <profile>', 'Target profile name')
		.addOption(
			new Option(
				'--mode <mode>',
				'add (only new records), merge (creates and updates, never deletes), or mirror (includes deletions)',
			).choices(MODES),
		)
		.option(
			'--allow-version-drift',
			'Diff despite a snapshot/target Directus version mismatch; without it an exact match is required',
		)
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: DiffOptions) => diff(options, getContext()));
}

// Nulls, not zeros, when no data was previewed: the report must not read as a reconcile that found nothing.
function reconcileCounts(preview: DataPreviewPlan | undefined): ReconcileCounts {
	if (preview === undefined) return { matched: null, ambiguous: null, unmatched: null, unchanged: null };

	return {
		matched: preview.matchedCount,
		ambiguous: preview.ambiguousCount,
		unmatched: preview.unmatchedCount,
		unchanged: preview.unchangedCount,
	};
}

export async function diff(options: DiffOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, options.project, ctx);
	const { url, credential, project, projectConfig } = target;

	const mode: SyncMode = resolveMode(options.mode, projectConfig);

	ctx.ui.info(`Comparing commit-ready files with ${options.to} — ${url} (${describeMode(mode)})`);

	const schema = await planSchema(target, mode, options.allowVersionDrift ?? false, ctx);

	const preview = await previewData(target, mode);

	// A truncated source cannot prove mirror deletions, even though the dry-run can display them.
	if (mode === 'mirror' && preview !== undefined && preview.incomplete.length > 0) {
		ctx.ui.warn(
			`The commit-ready configuration is incomplete for ${preview.incomplete.join(', ')} — the source hid records from reads at pull time, and push will refuse mirror. Push with --mode merge, or license the source and re-pull.`,
		);
	}

	let dryRun: ImportBatchResult | undefined;
	let dataSummary: ImportSummary | undefined;

	if (preview !== undefined) {
		// Under mirror, an empty collection entry can still delete target records.
		if (dataPhaseConverged(preview.records, mode)) {
			dataSummary = emptyImportSummary();
		} else {
			const dry = await dryRunImport(credential, preview.batch, mode, preview.unchanged);
			dryRun = dry.result;
			dataSummary = dry.summary;
		}
	}

	const dataChanged = dataSummary !== undefined && hasImportChanges(dataSummary);

	const unresolved = preview?.ambiguousCount ?? 0;

	if (ctx.ui.json) {
		// Unresolved identities count as changes because a non-interactive push cannot apply them.
		ctx.ui.data({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project,
			mode,
			changes: schema.result !== null || dataChanged || unresolved > 0,
			unresolved,
			schemaSkipped: !schema.enabled,
			added: schema.added,
			modified: schema.modified,
			deleted: schema.deleted,
			hash: schema.result?.hash ?? null,
			data: dataReport(mode, preview, dryRun, reconcileCounts(preview)),
		});

		return;
	}

	// An all-ambiguous set has a zero dry-run but is not converged.
	if (schema.result === null && !dataChanged && unresolved === 0) {
		ctx.ui.success(convergedMessage('diff', options.to, schema, preview !== undefined));
		return;
	}

	renderSchemaPlan(schema, ctx);

	// Diff always dry-runs, so there is never an unpriced batch to describe instead.
	renderDataPlan(dataSummary, unresolved, undefined, ctx);

	if (preview !== undefined) {
		const pending = preview.ambiguousCount + preview.unmatchedCount;

		if (pending > 0) {
			const detail =
				preview.ambiguousCount > 0
					? ` (${preview.ambiguousCount} ambiguous — run push in a terminal to choose the match; a non-interactive push refuses until they are resolved)`
					: '';

			ctx.ui.info(
				`${count(pending, 'configuration record')} ${pending === 1 ? 'has' : 'have'} no target match yet — the first push will match or create them${detail}.`,
			);
		}
	}
}
