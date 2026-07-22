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
import type { Mode } from '../../sync/mode.js';
import { emptyImportSummary, type ImportSummary, summarizeDiff, summarizeImport } from '../../sync/render.js';
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
	readonly allowDeletes?: boolean;
	readonly yes?: boolean;
	readonly project: string;
}

/**
 * Exported so diff previews the exact push these mappings produce (spec Q15) — a single source of truth
 * for how a mode reaches the schema and data wires, never a second copy that could drift.
 */
/**
 * mode → schema diff mode: add and merge both take the additive schema diff (add never deletes); only
 * mirror computes a deleting diff.
 */
export function schemaDiffMode(mode: Mode): 'merge' | 'mirror' {
	return mode === 'mirror' ? 'mirror' : 'merge';
}

/**
 * mode → data import options: add inserts only, merge upserts, mirror upserts AND deletes rows absent
 * from the import set. The server requires mode=merge alongside dangerouslyAllowDelete, so mirror maps to
 * merge+flag rather than a wire "mirror" (which does not exist).
 */
export function dataImportOptions(mode: Mode): { mode: 'add' | 'merge'; dangerouslyAllowDelete?: boolean } {
	if (mode === 'add') return { mode: 'add' };
	if (mode === 'mirror') return { mode: 'merge', dangerouslyAllowDelete: true };
	return { mode: 'merge' };
}

/**
 * Resolve the effective mode: an explicit flag wins, else the project config's mode, else additive merge —
 * the path of least surprise, so deletions are always opted into rather than defaulted on. Exported so diff
 * resolves it identically and thus previews exactly the push this mode would run.
 */
export function resolveMode(flag: Mode | undefined, projectConfig: ProjectConfig | undefined): Mode {
	return flag ?? projectConfig?.mode ?? 'merge';
}

/**
 * Run the data import as a dry-run — the server executes it and rolls it back — and summarize the plan.
 * Returns both the raw per-collection result (diff persists it into the --json payload) and the rendered
 * summary (the human plan and the deletion gate read it), so diff and push preview the same import through
 * one call instead of each assembling the dryRun option set and summarizing separately.
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

// After the import, record sourceId → finalId for every system record sent, where finalId is the
// server's remap of the sent pk (add mode on a conflict) or the sent pk itself. Identity entries are
// included deliberately: they let a future reconcile skip a settled record and protect it from later
// ambiguity. Content collections get no entries (no reconcile, pk-as-is). Persisted with writeIdMap.
function updateIdMap(dataResult: DataPushPlan, importResult: ImportBatchResult): void {
	let map = dataResult.map;

	for (const { collection, records } of dataResult.systemSent) {
		const mapped = importResult.collections[collection]?.mapped ?? {};
		const entries: Record<string, string> = {};

		for (const { sourceId, sentPk } of records) {
			// A withheld PK (collision guard) means the server assigned an id the response cannot report;
			// writing any entry would bind the source to the WRONG row. The next push reconciles the created
			// row by natural key and the map heals with the true id.
			if (sentPk === null) continue;

			const finalPk = mapped[sentPk];
			entries[sourceId] = finalPk === undefined ? sentPk : String(finalPk);
		}

		map = withMappings(map, dataResult.source, dataResult.target, collection, entries);
	}

	writeIdMap(dataResult.idMapPath, map);
}

// The --json data block: always present so a consumer never guesses whether the data phase ran. Skipped
// (no committed data) carries null-ish fields; a real run carries the mode, source, and the server's
// per-collection response verbatim — or {} when the batch had nothing to send and the import was skipped
// as converged, which is a checked outcome, not a skipped phase.
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

	// Print the resolved target before any network call so a profile NAMED staging pointing at prod's
	// URL is visible before anything mutates. Human channel only; --json consumers get profile + target
	// in the payload. Naming the authenticated identity here needs an extra request — deliberately deferred.
	ctx.ui.info(`target: ${options.to} — ${url}`);

	const result = await localDiff(target, schemaDiffMode(mode));

	// The data phase prep runs before any plan display or gate: it fetches target records, reconciles, and
	// (interactive) prompts on ambiguity, or refuses loudly in CI — all before a single mutation.
	const dataResult = await prepareDataPush(target, mode, ctx);

	const schema = summarizeDiff(result === null ? null : result.diff);

	const schemaTotal = schema.added + schema.modified + schema.deleted;

	// Both empty is the command's answer, not a failure: exit 0 and never reach an apply or import call.
	// "Empty" data is either no committed data at all, or a checked batch with nothing left to send —
	// every record proven already right on the target (impossible under mirror, whose batch keeps its
	// rows for the delete semantics, so no deletion is ever skipped here).
	if (result === null && (dataResult.skipped || dataResult.records === 0)) {
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

	const allowDeletes = options.allowDeletes ?? false;
	const yes = options.yes ?? false;

	// The dry-run is INTERACTIVE ONLY: it runs the whole import transaction and rolls it back, so the plan
	// shows the real created/updated/deleted per collection with PKs. CI skips it — flags are the contract
	// and a dry-run doubles the push cost — so CI cannot know data deletions ahead of time (see the gate).
	let dataSummary: ImportSummary | undefined;

	if (ctx.interactive && !dataResult.skipped) {
		// An empty batch has nothing to dry-run (and the server has nothing to plan): the summary is the
		// explicit zero, not a wire call.
		dataSummary =
			dataResult.records === 0
				? emptyImportSummary()
				: (await dryRunImport(credential, dataResult.batch, mode, dataResult.unchanged)).summary;
	}

	const dataDeleted = dataSummary?.deleted ?? 0;

	// Render the plan before any gate — the push's dry-run view — so the operator (or the CI log) sees what
	// would change before a prompt or a refusal. --json stays silent here; its payload lands at the end.
	if (!ctx.ui.json) {
		if (result !== null) {
			ctx.ui.info(`${count(schemaTotal, 'schema change')} to push to ${url}:`);
			for (const line of schema.lines) ctx.ui.print(line);
		}

		if (!dataResult.skipped) {
			if (dataSummary !== undefined) {
				// An all-zero plan is stated plainly — never a "data changes" header over a "no data changes" line.
				if (dataSummary.created > 0 || dataSummary.updated > 0 || dataSummary.deleted > 0) {
					ctx.ui.info(`data changes to import to ${url}:`);
					for (const line of dataSummary.lines) ctx.ui.print(line);
				} else {
					ctx.ui.info('no data changes to import.');
				}
			} else if (dataResult.records > 0) {
				const { records, collections } = dataResult;

				ctx.ui.info(`${count(records, 'record')} across ${count(collections, 'collection')} to import (${mode}).`);
			}
		}
	}

	// The invariant across every gate: --yes never authorizes deletions. Deletions require either
	// --allow-deletes (the CI consent) or the interactive typed confirmation (the human consent).

	// mirror in CI without --allow-deletes is refused outright: it can delete BOTH schema and data rows
	// absent from the import set, and CI skips the dry-run, so the data deletions are unknowable here.
	// Checked before the generic missing-confirmation gate so the operator gets the deletion-specific fix.
	if (!ctx.interactive && mode === 'mirror' && !allowDeletes) {
		throw new CliError('USAGE', 'Refusing mirror mode in a non-interactive context without --allow-deletes.', {
			hint: 'mirror can delete schema and data rows absent from the import set; pass --allow-deletes to consent, or use --mode merge.',
		});
	}

	// A merge/add diff should never carry schema deletions, but guard: a deletion in CI still demands the
	// --allow-deletes consent rather than riding in under --yes.
	if (!ctx.interactive && schema.deleted > 0 && !allowDeletes) {
		throw new CliError('USAGE', `This push deletes ${count(schema.deleted, 'schema item')}.`, {
			hint: '--yes does not cover deletions; pass --allow-deletes or use --mode merge.',
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

	// The last gate before the act: any destruction on the table — schema deletions OR data deletions the
	// dry-run surfaced — that was not pre-authorized with --allow-deletes must be typed out in full. --yes
	// cannot reach past this; the invariant holds.
	if (ctx.interactive && (schema.deleted > 0 || dataDeleted > 0) && !allowDeletes) {
		const typed = await ask(
			text({
				message: `This push DELETES data that cannot be restored. Type "${options.to}" to confirm:`,
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
		ctx.ui.info('schema applied.');
	}

	let importResult: ImportBatchResult | undefined;

	if (!dataResult.skipped && dataResult.records === 0) {
		// A checked batch with nothing left to send: every record is already right on the target. The
		// interactive plan already said so; say it here for the CI log, which saw no plan.
		if (dataSummary === undefined) ctx.ui.info('no data changes to import.');
	} else if (!dataResult.skipped) {
		ctx.ui.info(`importing ${count(dataResult.collections, 'collection')}…`);

		try {
			importResult = await importBatch(credential, dataResult.batch, dataImportOptions(mode));
		} catch (error) {
			// Partial failure: the schema landed but the import did not. Do not roll back (no rollback
			// exists) — surface loudly that schema WAS applied and a re-run retries only the data (the schema
			// diff will now be empty), then rethrow the enriched error.
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
		ctx.ui.info('id map updated.');
	}

	const importSummary =
		!dataResult.skipped && importResult !== undefined ? summarizeImport(importResult, dataResult.unchanged) : undefined;

	const dataChanged =
		importSummary !== undefined &&
		(importSummary.created > 0 || importSummary.updated > 0 || importSummary.deleted > 0);

	if (ctx.ui.json) {
		ctx.ui.data({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project: target.project,
			mode,
			// `applied` and the added/modified/deleted counts are schema-scoped (the data block carries the
			// import detail); `changes` is the overall answer — a data-only push that imported rows is a change.
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

	if (!dataResult.skipped && dataResult.records === 0) {
		dataSentence = ' No data changes to import.';
	}

	if (!dataResult.skipped && importSummary !== undefined) {
		dataSentence = ` Imported ${count(dataResult.records, 'record')} across ${count(dataResult.collections, 'collection')}: ${importSummary.created} created, ${importSummary.updated} updated, ${importSummary.deleted} deleted.`;
	}

	ctx.ui.success(`${schemaSentence}${dataSentence}`);
}
