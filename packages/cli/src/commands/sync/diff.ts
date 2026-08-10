import { type Command, Option } from 'commander';
import { describeMode, MODES, type SyncMode } from '../../kernel/config/mode.js';
import type { CliContext } from '../../kernel/run.js';
import { maybePluralize } from '../../kernel/text.js';
import type { ImportBatchResult } from './utils/contract.js';
import { type DataPreviewPlan, previewData } from './utils/data-push.js';
import {
	claimedKeyLines,
	claimedTemporaryKeys,
	convergedMessage,
	type DataComparisonCounts,
	dataPhaseConverged,
	dataReport,
	dryRunImport,
	planSchema,
	renderDataPlan,
	renderSchemaPlan,
	resolveMode,
} from './utils/plan.js';
import { emptyImportSummary, hasImportChanges, type ImportSummary } from './utils/render.js';
import { DEFAULT_PROJECT, displayProjectPath, resolveTarget } from './utils/resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	/** No commander default: an absent flag falls through the same precedence push uses. */
	readonly mode?: SyncMode;
	/** Surfaces the server's own sanctioned bypass of its version and vendor gates on /schema/diff. */
	readonly allowDrift?: boolean;
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
			'--allow-drift',
			'Diff despite a snapshot/target Directus version or database vendor mismatch; without it both must match',
		)
		.option('--project <name>', 'Project scope to sync (default: default)', DEFAULT_PROJECT)
		.action((options: DiffOptions) => diff(options, getContext()));
}

function comparisonCounts(preview: DataPreviewPlan | undefined): DataComparisonCounts | undefined {
	if (preview === undefined) return undefined;

	return {
		reconciliation: {
			matched: preview.matchedCount,
			unmatched: preview.unmatchedCount,
			ambiguous: preview.ambiguousCount,
			dependent: preview.dependentCount,
		},
		unchanged: preview.unchangedCount,
	};
}

export async function diff(options: DiffOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, options.project, ctx);
	const { url, credential, project, projectConfig, projectDir } = target;

	const mode: SyncMode = resolveMode(options.mode, projectConfig);
	const projectPath = displayProjectPath(ctx.cwd, projectDir);

	ctx.ui.info(`Comparing ${projectPath} with ${options.to} — ${url} (${describeMode(mode)})`);

	const schema = await planSchema(target, { command: 'diff', mode, allowDrift: options.allowDrift ?? false }, ctx);

	const preview = await previewData(target, mode);

	// A truncated source cannot prove mirror deletions, even though the dry-run can display them.
	if (mode === 'mirror' && preview !== undefined && preview.incomplete.length > 0) {
		ctx.ui.warn(
			`The configuration in ${projectPath} is incomplete for ${preview.incomplete.join(', ')} — the source hid records from reads at pull time, and push will refuse mirror. Push with --mode merge, or license the source and re-pull.`,
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

			const claimed = claimedTemporaryKeys(dry.result, preview.systemSent);

			if (claimed.length > 0) {
				const lines = claimedKeyLines(claimed);

				ctx.ui.warn(
					`The dry run matched ${maybePluralize(claimed.length, 'temporary key')} to real target records hidden from list reads, so the plan prices ${claimed.length === 1 ? 'it' : 'them'} as ${claimed.length === 1 ? 'an update' : 'updates'}. Push will refuse this state.\n  ${lines.join('\n  ')}`,
				);
			}
		}
	}

	const dataChanged = dataSummary !== undefined && hasImportChanges(dataSummary);

	const ambiguous = preview?.ambiguousCount ?? 0;

	// Ambiguous matches count as changes because a non-interactive push cannot apply them.
	ctx.ui.result({
		target: url,
		profile: options.to,
		project,
		mode,
		changes: schema.result !== null || dataChanged || ambiguous > 0,
		schemaSkipped: !schema.enabled,
		added: schema.added,
		modified: schema.modified,
		deleted: schema.deleted,
		hash: schema.result?.hash ?? null,
		data: dataReport(mode, preview, dryRun, comparisonCounts(preview)),
	});

	if (ctx.ui.json) return;

	// An all-ambiguous set has a zero dry-run but is not converged.
	if (schema.result === null && !dataChanged && ambiguous === 0) {
		ctx.ui.success(convergedMessage('diff', target, ctx.cwd, schema, preview !== undefined));
		return;
	}

	renderSchemaPlan(schema, ctx);

	// An ambiguity holds its records out of the batch, so the dry run can come back empty for a diff that is
	// anything but converged. Printing "no changes" there would contradict the lines that follow it.
	const ambiguityEmptiedThePlan = ambiguous > 0 && dataSummary !== undefined && !hasImportChanges(dataSummary);

	// No batch size to pass: diff always dry-runs, so there is never an unpriced batch.
	if (!ambiguityEmptiedThePlan) renderDataPlan(dataSummary, undefined, ctx);

	if (preview === undefined) return;

	const { ambiguousCount, dependentCount, unmatchedCount } = preview;

	if (ambiguousCount > 0) {
		const subject = maybePluralize(ambiguousCount, 'configuration record');
		const match = ambiguousCount === 1 ? 'has an ambiguous target match' : 'have ambiguous target matches';

		const dependent =
			dependentCount === 0
				? ''
				: `; ${maybePluralize(dependentCount, 'record')} ${dependentCount === 1 ? 'depends' : 'depend'} on ${ambiguousCount === 1 ? 'that choice' : 'those choices'}`;

		ctx.ui.info(`${subject} ${match}${dependent}.`);
	}

	if (unmatchedCount > 0) {
		ctx.ui.info(
			`${maybePluralize(unmatchedCount, 'configuration record')} ${unmatchedCount === 1 ? 'has' : 'have'} no target match — push would create ${unmatchedCount === 1 ? 'it' : 'them'}.`,
		);
	}

	// Last, so the instruction closes the report rather than interrupting the facts.
	if (ambiguousCount > 0) ctx.ui.info('Run d6s sync push interactively to choose.');
}
