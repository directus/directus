import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { fetchDiff } from '../../sync/api.js';
import { SNAPSHOT_PARTIAL } from '../../sync/contract.js';
import { summarizeDiff } from '../../sync/render.js';
import { readSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	readonly mode: 'merge' | 'mirror';
}

export async function diff(options: DiffOptions, ctx: CliContext): Promise<void> {
	const { url, credential, schemaDir } = resolveTarget(options.to, ctx);

	const snapshot = readSnapshotFiles(schemaDir);

	// Guard before any network call: pull only writes full snapshots today, so a partial here is
	// hand-crafted state — refuse rather than let a scoped snapshot propose deleting everything it omits.
	if (snapshot.version === SNAPSHOT_PARTIAL && options.mode === 'mirror') {
		throw new CliError('USAGE', 'A partial snapshot cannot be diffed in mirror mode.', {
			hint: 'Mirror mode proposes deleting everything the snapshot omits. Use --mode merge.',
		});
	}

	const result = await fetchDiff(credential, snapshot, options.mode);

	// A no-op diff is the command's answer, not a failure — exit 0 with or without changes.
	if (result === null) {
		if (ctx.ui.json) {
			ctx.ui.data({
				ok: true,
				target: url,
				mode: options.mode,
				changes: false,
				added: 0,
				modified: 0,
				deleted: 0,
				hash: null,
			});

			return;
		}

		ctx.ui.success(`No schema changes between the local snapshot and ${url}.`);
		return;
	}

	const { added, modified, deleted, lines } = summarizeDiff(result.diff);

	if (ctx.ui.json) {
		// hash travels with the machine payload: apply seals against this diff and CI may persist it.
		ctx.ui.data({
			ok: true,
			target: url,
			mode: options.mode,
			changes: true,
			added,
			modified,
			deleted,
			hash: result.hash,
		});

		return;
	}

	const total = added + modified + deleted;

	ctx.ui.info(`${total} schema ${total === 1 ? 'change' : 'changes'} between the local snapshot and ${url}:`);
	for (const line of lines) ctx.ui.print(line);
}
