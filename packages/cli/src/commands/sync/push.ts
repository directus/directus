import { relative } from 'node:path';
import { confirm, text } from '@clack/prompts';
import type { ResolvedCredential } from '../../kernel/config/credentials.js';
import type { ProjectConfig } from '../../kernel/config/file.js';
import { CliError, withHint } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import { applyDiff, importBatch } from '../../sync/api.js';
import type { ImportBatchResult, ImportCollectionData } from '../../sync/contract.js';
import { withMappings, writeIdMap } from '../../sync/id-map.js';
import { describeMode, type Mode } from '../../sync/mode.js';
import {
	emptyImportSummary,
	hasImportChanges,
	type ImportSummary,
	summarizeDiff,
	summarizeImport,
} from '../../sync/render.js';
import { type DataPushPlan, type DataPushResult, prepareDataPush, type UnchangedRows } from './data-push.js';
import { localDiff } from './local-diff.js';
import { resolveTarget } from './resolve-target.js';

export interface PushOptions {
	readonly to: string;
	/**
	 * No commander default: an absent flag resolves to the project config's mode, then 'merge'. Choices
	 * are validated by commander (add|merge|mirror), so a present value is always one of the three.
	 */
	readonly mode?: Mode;
	/** Deliberately loud flag name, mirroring the API's import parameter — the one consent for deletions. */
	readonly dangerouslyAllowDelete?: boolean;
	readonly yes?: boolean;
	readonly project: string;
}

/**
 * Map a user-facing mode to schema diff semantics. Add and merge are additive; mirror permits deletions.
 */
export function schemaDiffMode(mode: Mode): 'merge' | 'mirror' {
	return mode === 'mirror' ? 'mirror' : 'merge';
}

/**
 * Map a user-facing mode to import options. The API represents mirror as merge plus delete permission.
 */
export function dataImportOptions(mode: Mode): { mode: 'add' | 'merge'; dangerouslyAllowDelete?: boolean } {
	if (mode === 'add') return { mode: 'add' };
	if (mode === 'mirror') return { mode: 'merge', dangerouslyAllowDelete: true };
	return { mode: 'merge' };
}

/**
 * Resolve flag over project config over additive merge, so deletions are never the default.
 */
export function resolveMode(flag: Mode | undefined, projectConfig: ProjectConfig | undefined): Mode {
	return flag ?? projectConfig?.mode ?? 'merge';
}

/**
 * Whether the data phase is done. Mirror never converges from record count alone because an empty
 * collection entry can still delete target rows.
 */
export function dataPhaseConverged(data: { skipped: true } | { skipped: false; records: number }, mode: Mode): boolean {
	return data.skipped || (data.records === 0 && mode !== 'mirror');
}

/**
 * Execute and roll back a data import, returning both its wire result and rendered summary.
 */
export async function dryRunImport(
	credential: ResolvedCredential,
	batch: ImportCollectionData[],
	mode: Mode,
	unchanged?: UnchangedRows,
): Promise<{ result: ImportBatchResult; summary: ImportSummary }> {
	const result = await importBatch(credential, batch, { ...dataImportOptions(mode), dryRun: true });
	return { result, summary: summarizeImport(result, unchanged) };
}

// Record each sent system identity so later pushes update the same target row instead of duplicating it.
function updateIdMap(dataResult: DataPushPlan, importResult: ImportBatchResult): void {
	let map = dataResult.map;

	for (const { collection, records } of dataResult.systemSent) {
		const mapped = importResult.collections[collection]?.mapped ?? {};
		const entries: Record<string, string> = {};

		for (const { sourceId, sentPk } of records) {
			// A withheld PK receives an unreported server ID; guessing would bind the source to the wrong row.
			if (sentPk === null) continue;

			const finalPk = mapped[sentPk];
			entries[sourceId] = finalPk === undefined ? sentPk : String(finalPk);
		}

		map = withMappings(map, dataResult.source, dataResult.target, collection, entries);
	}

	writeIdMap(dataResult.idMapPath, map);
}

interface PushDataReport {
	mode: Mode;
	source: string | null;
	collections: ImportBatchResult['collections'] | null;
	skipped: boolean;
}

function dataReport(
	mode: Mode,
	dataResult: DataPushResult,
	importResult: ImportBatchResult | undefined,
): PushDataReport {
	if (dataResult.skipped) {
		return { mode, source: null, collections: null, skipped: true };
	}

	return { mode, source: dataResult.source, collections: importResult?.collections ?? {}, skipped: false };
}

export async function push(options: PushOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, ctx, options.project);
	const { url, credential } = target;

	const mode: Mode = resolveMode(options.mode, target.projectConfig);

	// Show the resolved URL and the mode's consequences before any remote work: a misleading profile name
	// must be visible, and "mirror deletes" must never be a surprise learned at the refusal.
	ctx.ui.info(`Pushing to ${options.to} — ${url} (${describeMode(mode)})`);

	const result = await localDiff(target, schemaDiffMode(mode));

	// Preparation may persist learned local identities, but all remote mutations remain behind the gates.
	const dataResult = await prepareDataPush(target, mode, ctx);

	const schema = summarizeDiff(result === null ? null : result.diff);

	const schemaTotal = schema.added + schema.modified + schema.deleted;

	if (result === null && dataPhaseConverged(dataResult, mode)) {
		if (ctx.ui.json) {
			ctx.ui.data({
				kind: 'PushReport',
				formatVersion: 1,
				ok: true,
				target: url,
				profile: options.to,
				project: target.project,
				mode,
				applied: false,
				changes: false,
				added: 0,
				modified: 0,
				deleted: 0,
				hash: null,
				data: dataReport(mode, dataResult, undefined),
			});

			return;
		}

		const tail = dataResult.skipped ? 'nothing to push.' : 'schema and data match; nothing to push.';
		ctx.ui.success(`${options.to} already matches the local snapshot — ${tail}`);
		return;
	}

	const allowDeletes = options.dangerouslyAllowDelete ?? false;
	const yes = options.yes ?? false;

	// CI skips the extra import transaction, so mirror requires explicit delete consent without a data plan.
	let dataSummary: ImportSummary | undefined;

	if (ctx.interactive && !dataResult.skipped) {
		dataSummary = dataPhaseConverged(dataResult, mode)
			? emptyImportSummary()
			: (await dryRunImport(credential, dataResult.batch, mode, dataResult.unchanged)).summary;
	}

	const dataDeleted = dataSummary?.deleted ?? 0;

	if (!ctx.ui.json) {
		if (result !== null) {
			ctx.ui.info(`Schema — ${count(schemaTotal, 'change')} to apply:`);
			for (const line of schema.lines) ctx.ui.plan(line);
		}

		if (!dataResult.skipped) {
			if (dataSummary !== undefined) {
				if (hasImportChanges(dataSummary)) {
					ctx.ui.info('Data — changes to import:');
					for (const line of dataSummary.lines) ctx.ui.plan(line);
				} else {
					ctx.ui.info('Data — no changes to import.');
				}
			} else if (dataResult.records > 0) {
				const { records, collections } = dataResult;

				// Non-interactive pushes skip the dry-run, so record counts are the only preview available.
				ctx.ui.info(`Data — ${count(records, 'record')} across ${count(collections, 'collection')} to import.`);
			}
		}
	}

	// --yes never authorizes deletion; CI mirror needs explicit consent because it skips the data dry-run.
	if (!ctx.interactive && mode === 'mirror' && !allowDeletes) {
		throw new CliError(
			'USAGE',
			'Refusing mirror mode in a non-interactive context without --dangerously-allow-delete.',
			{
				hint: 'mirror can delete schema and data rows absent from the import set; pass --dangerously-allow-delete to consent, or use --mode merge.',
			},
		);
	}

	// Guard unexpected schema deletions under additive modes too.
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
		const proceed = await ask(confirm({ message: `Apply changes to ${options.to} — ${url}?` }));

		if (!proceed) throw new CliError('USAGE', 'Push aborted; nothing was applied.');
	}

	// Interactive deletions require typed confirmation unless already authorized explicitly.
	if (ctx.interactive && (schema.deleted > 0 || dataDeleted > 0) && !allowDeletes) {
		// Name what dies, not just that something does: the operator confirms specific losses.
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

	if (result !== null) {
		try {
			await applyDiff(credential, result);
		} catch (error) {
			// The diff was generated moments ago, so a hash mismatch means the target schema changed
			// concurrently — surface that and point at a re-run. Everything else rethrows untouched.
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

	if (!dataResult.skipped && dataPhaseConverged(dataResult, mode)) {
		if (dataSummary === undefined) ctx.ui.info('Data — no changes to import.');
	} else if (!dataResult.skipped) {
		ctx.ui.info(`Importing data (${count(dataResult.collections, 'collection')})…`);

		try {
			importResult = await importBatch(credential, dataResult.batch, dataImportOptions(mode));
		} catch (error) {
			// Schema apply has no rollback; make the partial commit and retry path explicit.
			if (schemaApplied && error instanceof CliError) {
				ctx.ui.warn('Schema was applied, but the data import failed. Re-run push to retry the data import.');

				throw withHint(
					error,
					'Schema is already applied — re-run d6s sync push to retry the data import against an empty schema diff.',
				);
			}

			throw error;
		}

		updateIdMap(dataResult, importResult);

		// The map is how the NEXT push updates these rows instead of duplicating them — committing it is
		// part of the workflow, and a first-time operator has no way to know that unprompted.
		ctx.ui.info(`Identity map updated — commit ${relative(ctx.cwd, dataResult.idMapPath)} with this change.`);
	}

	const importSummary =
		!dataResult.skipped && importResult !== undefined ? summarizeImport(importResult, dataResult.unchanged) : undefined;

	const dataChanged = importSummary !== undefined && hasImportChanges(importSummary);

	if (ctx.ui.json) {
		ctx.ui.data({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project: target.project,
			mode,
			// Schema counts stay schema-scoped; changes includes schema or data work.
			applied: schemaApplied,
			changes: result !== null || dataChanged,
			added: schema.added,
			modified: schema.modified,
			deleted: schema.deleted,
			hash: result?.hash ?? null,
			data: dataReport(mode, dataResult, importResult),
		});

		return;
	}

	const schemaSentence =
		result !== null
			? `Applied ${count(schemaTotal, 'schema change')} to ${url}; schema hash verified.`
			: `Schema already matches ${url}.`;

	let dataSentence = ' Data phase skipped (no committed data).';

	if (!dataResult.skipped && dataPhaseConverged(dataResult, mode)) {
		dataSentence = ' No data changes to import.';
	}

	if (!dataResult.skipped && importSummary !== undefined) {
		dataSentence = ` Imported ${count(dataResult.records, 'record')} across ${count(dataResult.collections, 'collection')}: ${importSummary.created} created, ${importSummary.updated} updated, ${importSummary.deleted} deleted.`;
	}

	ctx.ui.success(`${schemaSentence}${dataSentence}`);
}
