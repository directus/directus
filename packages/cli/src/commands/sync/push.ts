import { confirm, text } from '@clack/prompts';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { applyDiff, importBatch } from '../../sync/api.js';
import type { ImportBatchResult } from '../../sync/contract.js';
import { type IdMap, withMappings, writeIdMap } from '../../sync/id-map.js';
import { type ImportSummary, summarizeDiff, summarizeImport } from '../../sync/render.js';
import { type DataPushResult, prepareDataPush } from './data-push.js';
import { localDiff } from './local-diff.js';
import { resolveTarget } from './resolve-target.js';

export interface PushOptions {
	readonly to: string;
	// No commander default: an absent flag resolves to the project config's mode, then 'merge'. Choices
	// are validated by commander (add|merge|mirror), so a present value is always one of the three.
	readonly mode?: 'add' | 'merge' | 'mirror';
	readonly allowDeletes?: boolean;
	readonly yes?: boolean;
	readonly project: string;
}

type Mode = 'add' | 'merge' | 'mirror';

// mode → schema diff mode: add and merge both take the additive schema diff (add never deletes); only
// mirror computes a deleting diff.
function schemaDiffMode(mode: Mode): 'merge' | 'mirror' {
	return mode === 'mirror' ? 'mirror' : 'merge';
}

// mode → data import options: add inserts only, merge upserts, mirror upserts AND deletes rows absent
// from the import set. The server requires mode=merge alongside dangerouslyAllowDelete, so mirror maps to
// merge+flag rather than a wire "mirror" (which does not exist).
function dataImportOptions(mode: Mode): { mode: 'add' | 'merge'; dangerouslyAllowDelete?: boolean } {
	if (mode === 'add') return { mode: 'add' };
	if (mode === 'mirror') return { mode: 'merge', dangerouslyAllowDelete: true };
	return { mode: 'merge' };
}

// After the import, record sourceId → finalId for every system record sent, where finalId is the
// server's remap of the sent pk (add mode on a conflict) or the sent pk itself. Identity entries are
// included deliberately: they let a future reconcile skip a settled record and protect it from later
// ambiguity. Content collections get no entries (no reconcile, pk-as-is). Persisted with writeIdMap.
function updateIdMap(dataResult: Extract<DataPushResult, { skipped: false }>, importResult: ImportBatchResult): IdMap {
	let map = dataResult.map;

	for (const { collection, records } of dataResult.systemSent) {
		const mapped = importResult.collections[collection]?.mapped ?? {};
		const entries: Record<string, string> = {};

		for (const { sourceId, sentPk } of records) {
			const finalPk = mapped[sentPk];
			entries[sourceId] = finalPk === undefined ? sentPk : String(finalPk);
		}

		map = withMappings(map, dataResult.source, dataResult.target, collection, entries);
	}

	writeIdMap(dataResult.idMapPath, map);
	return map;
}

// The --json data block: always present so a consumer never guesses whether the data phase ran. Skipped
// carries null-ish fields; a real run carries the mode, source, and the server's per-collection response
// verbatim.
function dataReport(
	mode: Mode,
	dataResult: DataPushResult,
	importResult: ImportBatchResult | undefined,
): { mode: Mode; source: string | null; collections: ImportBatchResult['collections'] | null; skipped: boolean } {
	if (dataResult.skipped || importResult === undefined) {
		return { mode, source: null, collections: null, skipped: true };
	}

	return { mode, source: dataResult.source, collections: importResult.collections, skipped: false };
}

export async function push(options: PushOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, ctx, options.project);
	const { url, credential } = target;

	// Precedence: an explicit flag wins, else the project config's mode, else additive merge — the path of
	// least surprise, so deletions are always opted into rather than defaulted on.
	const mode: Mode = options.mode ?? target.projectConfig?.mode ?? 'merge';

	// Print the resolved target before any network call so a profile NAMED staging pointing at prod's
	// URL is visible before anything mutates. Human channel only; --json consumers get profile + target
	// in the payload. Naming the authenticated identity here needs an extra request — deliberately deferred.
	ctx.ui.info(`target: ${options.to} — ${url}`);

	const { result } = await localDiff(target, schemaDiffMode(mode));

	// The data phase prep runs before any plan display or gate: it fetches target records, reconciles, and
	// (interactive) prompts on ambiguity, or refuses loudly in CI — all before a single mutation.
	const dataResult = await prepareDataPush(target, ctx);

	const schema =
		result === null ? { added: 0, modified: 0, deleted: 0, lines: [] as string[] } : summarizeDiff(result.diff);

	const schemaTotal = schema.added + schema.modified + schema.deleted;

	// Both empty is the command's answer, not a failure: exit 0 and never reach an apply or import call.
	if (result === null && dataResult.skipped) {
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

		ctx.ui.success(`${options.to} already matches the local snapshot — nothing to push.`);
		return;
	}

	const allowDeletes = options.allowDeletes ?? false;
	const yes = options.yes ?? false;

	// The dry-run is INTERACTIVE ONLY: it runs the whole import transaction and rolls it back, so the plan
	// shows the real created/updated/deleted per collection with PKs. CI skips it — flags are the contract
	// and a dry-run doubles the push cost — so CI cannot know data deletions ahead of time (see the gate).
	let dataSummary: ImportSummary | undefined;

	if (ctx.interactive && !dataResult.skipped) {
		const dryRun = await importBatch(credential, dataResult.batch, { ...dataImportOptions(mode), dryRun: true });
		dataSummary = summarizeImport(dryRun);
	}

	const dataDeleted = dataSummary?.deleted ?? 0;

	// Render the plan before any gate — the push's dry-run view — so the operator (or the CI log) sees what
	// would change before a prompt or a refusal. --json stays silent here; its payload lands at the end.
	if (!ctx.ui.json) {
		if (result !== null) {
			ctx.ui.info(`${schemaTotal} schema ${schemaTotal === 1 ? 'change' : 'changes'} to push to ${url}:`);
			for (const line of schema.lines) ctx.ui.print(line);
		}

		if (!dataResult.skipped) {
			if (dataSummary !== undefined) {
				ctx.ui.info(`data changes to import to ${url}:`);
				for (const line of dataSummary.lines) ctx.ui.print(line);
			} else {
				const { records, collections } = dataResult;

				ctx.ui.info(
					`${records} ${records === 1 ? 'record' : 'records'} across ${collections} ${collections === 1 ? 'collection' : 'collections'} to import (${mode}).`,
				);
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
		throw new CliError('USAGE', `This push deletes ${schema.deleted} schema item${schema.deleted === 1 ? '' : 's'}.`, {
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
				throw new CliError(error.code, error.message, {
					hint: 'The target schema changed while pushing. Re-run d6s sync push to generate a fresh diff.',
					...(error.detail !== undefined ? { detail: error.detail } : {}),
				});
			}

			throw error;
		}

		schemaApplied = true;
		ctx.ui.info('schema applied.');
	}

	let importResult: ImportBatchResult | undefined;

	if (!dataResult.skipped) {
		ctx.ui.info(`importing ${dataResult.collections} ${dataResult.collections === 1 ? 'collection' : 'collections'}…`);

		try {
			importResult = await importBatch(credential, dataResult.batch, dataImportOptions(mode));
		} catch (error) {
			// Partial failure: the schema landed but the import did not. Do not roll back (no rollback
			// exists) — surface loudly that schema WAS applied and a re-run retries only the data (the schema
			// diff will now be empty), then rethrow the enriched error.
			if (schemaApplied && error instanceof CliError) {
				ctx.ui.warn('Schema was applied, but the data import failed. Re-run push to retry the data import.');

				throw new CliError(error.code, error.message, {
					hint: 'Schema is already applied — re-run d6s sync push to retry the data import against an empty schema diff.',
					...(error.detail !== undefined ? { detail: error.detail } : {}),
				});
			}

			throw error;
		}

		updateIdMap(dataResult, importResult);
		ctx.ui.info('id map updated.');
	}

	if (ctx.ui.json) {
		ctx.ui.data({
			kind: 'PushReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
			project: target.project,
			mode,
			applied: schemaApplied,
			changes: result !== null,
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
			? `Applied ${schemaTotal} schema ${schemaTotal === 1 ? 'change' : 'changes'} to ${url}; schema hash verified.`
			: `Schema already matches ${url}.`;

	let dataSentence = ' Data phase skipped (no committed data).';

	if (!dataResult.skipped && importResult !== undefined) {
		const summary = summarizeImport(importResult);

		dataSentence = ` Imported ${dataResult.records} ${dataResult.records === 1 ? 'record' : 'records'} across ${dataResult.collections} ${dataResult.collections === 1 ? 'collection' : 'collections'}: ${summary.created} created, ${summary.updated} updated, ${summary.deleted} deleted.`;
	}

	ctx.ui.success(`${schemaSentence}${dataSentence}`);
}
