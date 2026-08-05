import { relative } from 'node:path';
import { confirm, text } from '@clack/prompts';
import { type Command, Option } from 'commander';
import { CliError, withHint } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import { applyDiff, importBatch } from '../../sync/api.js';
import type { ImportBatchResult } from '../../sync/contract.js';
import { type DataPushPlan, prepareDataPush } from '../../sync/data-push.js';
import { readDataFiles } from '../../sync/data-store.js';
import { withMappings, writeIdMap } from '../../sync/id-map.js';
import { describeMode, MODES, type SyncMode } from '../../sync/mode.js';
import {
	convergedMessage,
	dataImportOptions,
	dataPhaseConverged,
	dataReport,
	dryRunImport,
	planSchema,
	renderDataPlan,
	renderSchemaPlan,
	resolveMode,
} from '../../sync/plan.js';
import { emptyImportSummary, hasImportChanges, type ImportSummary, summarizeImport } from '../../sync/render.js';
import { resolveTarget } from '../../sync/resolve-target.js';

export interface PushOptions {
	readonly to: string;
	/**
	 * No commander default: an absent flag resolves to the project config's mode, then 'merge'. Choices
	 * are validated by commander (add|merge|mirror), so a present value is always one of the three.
	 */
	readonly mode?: SyncMode;
	/** Deliberately loud flag name, mirroring the API's import parameter — the one consent for deletions. */
	readonly dangerouslyAllowDelete?: boolean;
	/** The server's own sanctioned bypass of its exact-version/vendor gate on /schema/diff, made explicit. */
	readonly allowVersionDrift?: boolean;
	readonly yes?: boolean;
	readonly project: string;
}

export function registerPush(sync: Command, getContext: () => CliContext): void {
	sync
		.command('push')
		.description('Apply committed schema and data to a target instance')
		.requiredOption('--to <profile>', 'Target profile name')
		.addOption(
			new Option(
				'--mode <mode>',
				'add (only new records), merge (creates and updates, never deletes), or mirror (includes deletions)',
			).choices(MODES),
		)
		.option(
			'--dangerously-allow-delete',
			'Include deletions; without it deletions are refused outside interactive confirmation',
		)
		.option(
			'--allow-version-drift',
			'Push despite a snapshot/target Directus version mismatch; without it an exact match is required',
		)
		.option('--yes', 'Skip the apply confirmation; never authorizes deletions')
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: PushOptions) => push(options, getContext()));
}

function mirrorConsentRefusal(): CliError {
	return new CliError(
		'USAGE',
		'Refusing mirror mode in a non-interactive context without --dangerously-allow-delete.',
		{
			hint: 'mirror can delete schema and data rows absent from the import set; pass --dangerously-allow-delete to consent, or use --mode merge.',
		},
	);
}

function updateIdMap(dataResult: DataPushPlan, importResult: ImportBatchResult): void {
	let map = dataResult.map;

	for (const { collection, records } of dataResult.systemSent) {
		const mapped = importResult.collections[collection]?.mapped ?? {};
		const entries: Record<string, string> = {};

		for (const { sourceId, sentPk } of records) {
			if (sentPk === null) continue;

			const finalPk = mapped[sentPk];
			entries[sourceId] = finalPk === undefined ? sentPk : String(finalPk);
		}

		map = withMappings(map, dataResult.source, dataResult.target, collection, entries);
	}

	writeIdMap(dataResult.idMapPath, map);
}

export async function push(options: PushOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, options.project, ctx);
	const { url, credential, project, projectConfig, dataDir } = target;

	const mode: SyncMode = resolveMode(options.mode, projectConfig);
	const allowDeletes = options.dangerouslyAllowDelete ?? false;

	ctx.ui.info(`Pushing to ${options.to} — ${url} (${describeMode(mode)})`);

	// CI mirror requires explicit deletion consent because it skips the dry-run transaction. Committed
	// data makes that refusal certain whatever the schema phase finds, so settle it from local state
	// before any remote work; the data-less case still needs the convergence check further down.
	if (!ctx.interactive && mode === 'mirror' && !allowDeletes) {
		const committed = readDataFiles(dataDir);
		if (committed !== undefined && committed.collections.length > 0) throw mirrorConsentRefusal();
	}

	const schema = await planSchema(target, mode, options.allowVersionDrift ?? false, ctx);

	const dataResult = await prepareDataPush(target, mode, ctx);

	// Truncated source reads cannot authorize mirror deletions no plan can name.
	if (mode === 'mirror' && dataResult !== undefined && dataResult.incomplete.length > 0) {
		throw new CliError(
			'STATE',
			`Refusing mirror: the committed export is incomplete for ${dataResult.incomplete.join(', ')}.`,
			{
				hint: 'The source instance hid rows from reads when this data was pulled (unlicensed custom permission rules), so mirror would delete those rows on the target. Push with --mode merge, or license the source and re-pull.',
			},
		);
	}

	if (schema.result === null && dataPhaseConverged(dataResult?.records, mode)) {
		if (ctx.ui.json) {
			ctx.ui.data({
				kind: 'PushReport',
				formatVersion: 1,
				ok: true,
				target: url,
				profile: options.to,
				project,
				mode,
				applied: false,
				changes: false,
				schemaSkipped: !schema.enabled,
				added: 0,
				modified: 0,
				deleted: 0,
				hash: null,
				data: dataReport(mode, dataResult, undefined),
			});

			return;
		}

		ctx.ui.success(convergedMessage('push', options.to, schema, dataResult !== undefined));
		return;
	}

	const yes = options.yes ?? false;

	let dataSummary: ImportSummary | undefined;

	if (ctx.interactive && dataResult !== undefined) {
		dataSummary = dataPhaseConverged(dataResult.records, mode)
			? emptyImportSummary()
			: (await dryRunImport(credential, dataResult.batch, mode, dataResult.unchanged)).summary;
	}

	const dataDeleted = dataSummary?.deleted ?? 0;

	if (!ctx.ui.json) {
		renderSchemaPlan(schema, ctx);

		// prepareDataPush resolves every ambiguous identity or refuses, so a push never carries unresolved ones.
		renderDataPlan(dataSummary, 0, dataResult, ctx);
	}

	// Reached only when nothing was committed to push data from: this push still changes the schema.
	if (!ctx.interactive && mode === 'mirror' && !allowDeletes) throw mirrorConsentRefusal();

	if (!ctx.interactive && schema.deleted > 0 && !allowDeletes) {
		throw new CliError('USAGE', `This push deletes ${count(schema.deleted, 'schema item')}.`, {
			hint: '--yes does not cover deletions; pass --dangerously-allow-delete or use --mode merge.',
		});
	}

	if (!ctx.interactive && !yes) {
		throw new CliError('USAGE', 'Refusing to apply changes without confirmation.', {
			hint: 'Pass --yes to apply in a non-interactive context.',
		});
	}

	if (ctx.interactive && !yes) {
		const dataTotal = dataSummary === undefined ? 0 : dataSummary.created + dataSummary.updated + dataSummary.deleted;
		const planned: string[] = [];
		if (schema.total > 0) planned.push(count(schema.total, 'schema change'));
		if (dataTotal > 0) planned.push(count(dataTotal, 'data change'));

		const proceed = await ask(confirm({ message: `Apply ${planned.join(' and ')} to ${options.to} — ${url}?` }));

		if (!proceed) throw new CliError('USAGE', 'Push aborted; nothing was applied.');
	}

	if (ctx.interactive && (schema.deleted > 0 || dataDeleted > 0) && !allowDeletes) {
		const parts: string[] = [];
		if (dataDeleted > 0) parts.push(count(dataDeleted, 'record'));
		if (schema.deleted > 0) parts.push(count(schema.deleted, 'schema item'));

		const typed = await ask(
			text({
				message: `This push permanently deletes ${parts.join(' and ')} from ${options.to}. Type "${options.to}" to confirm:`,
			}),
		);

		if (typed !== options.to) {
			throw new CliError('USAGE', 'Confirmation did not match; nothing was applied.');
		}
	}

	let schemaApplied = false;

	if (schema.result !== null) {
		try {
			await applyDiff(credential, schema.result);
		} catch (error) {
			// A fresh hash mismatch means the target schema changed concurrently.
			if (error instanceof CliError && /INVALID_PAYLOAD/.test(error.detail ?? '') && /hash/i.test(error.detail ?? '')) {
				throw withHint(
					error,
					'The target schema changed while pushing. Re-run d6s sync push to generate a fresh diff.',
				);
			}

			throw error;
		}

		schemaApplied = true;
		ctx.ui.info('Schema applied.');
	}

	let importResult: ImportBatchResult | undefined;

	if (dataResult !== undefined && dataPhaseConverged(dataResult.records, mode)) {
		if (dataSummary === undefined) ctx.ui.info('Data — no changes to import.');
	} else if (dataResult !== undefined) {
		ctx.ui.info(`Importing data (${count(dataResult.collections, 'collection')})…`);

		try {
			importResult = await importBatch(credential, dataResult.batch, dataImportOptions(mode));
		} catch (error) {
			// Schema apply has no rollback; preserve any more specific import recovery hint.
			if (schemaApplied && error instanceof CliError) {
				ctx.ui.warn('Schema was applied, but the data import did not complete.');

				throw error.hint === undefined
					? withHint(
							error,
							'Schema is already applied — re-run d6s sync push to retry the data import against an empty schema diff.',
						)
					: error;
			}

			throw error;
		}

		updateIdMap(dataResult, importResult);

		ctx.ui.info(`Identity map updated: ${relative(ctx.cwd, dataResult.idMapPath)}`);
	}

	const importSummary =
		dataResult !== undefined && importResult !== undefined
			? summarizeImport(importResult, dataResult.unchanged)
			: undefined;

	const dataChanged = importSummary !== undefined && hasImportChanges(importSummary);

	if (ctx.ui.json) {
		ctx.ui.data({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project,
			mode,
			// `applied` describes the whole push, not only the schema phase.
			applied: schemaApplied || importResult !== undefined,
			changes: schema.result !== null || dataChanged,
			schemaSkipped: !schema.enabled,
			added: schema.added,
			modified: schema.modified,
			deleted: schema.deleted,
			hash: schema.result?.hash ?? null,
			data: dataReport(mode, dataResult, importResult),
		});

		return;
	}

	let schemaSentence: string;

	if (schema.result !== null) {
		schemaSentence = `Applied ${count(schema.total, 'schema change')} to ${url}; schema hash verified.`;
	} else if (schema.enabled) {
		schemaSentence = `Schema already matches ${url}.`;
	} else {
		schemaSentence = 'Schema phase skipped ("schema": false).';
	}

	let dataSentence = ' Data phase skipped (no committed data).';

	if (dataResult !== undefined && dataPhaseConverged(dataResult.records, mode)) {
		dataSentence = ' No data changes to import.';
	}

	if (dataResult !== undefined && importSummary !== undefined) {
		dataSentence = ` Imported ${count(dataResult.records, 'record')} across ${count(dataResult.collections, 'collection')}: ${importSummary.created} created, ${importSummary.updated} updated, ${importSummary.deleted} deleted.`;
	}

	ctx.ui.success(`Push complete. ${schemaSentence}${dataSentence}`);
}
