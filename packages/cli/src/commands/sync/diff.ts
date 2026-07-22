import type { CliContext } from '../../kernel/run.js';
import { summarizeDiff } from '../../sync/render.js';
import { localDiff } from './local-diff.js';
import { resolveTarget } from './resolve-target.js';

export interface DiffOptions {
	readonly to: string;
	readonly mode: 'merge' | 'mirror';
	readonly project: string;
}

export async function diff(options: DiffOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, ctx, options.project);
	const { url } = target;

	const { result } = await localDiff(target, options.mode);

	// A no-op diff is the command's answer, not a failure — exit 0 with or without changes.
	if (result === null) {
		if (ctx.ui.json) {
			ctx.ui.data({
				kind: 'DiffReport',
				formatVersion: 1,
				ok: true,
				target: url,
				profile: options.to,
				mode: options.mode,
				changes: false,
				added: 0,
				modified: 0,
				deleted: 0,
				hash: null,
			});

			return;
		}

		ctx.ui.success(`${options.to} matches the local snapshot — nothing to do.`);
		return;
	}

	const { added, modified, deleted, lines } = summarizeDiff(result.diff);

	if (ctx.ui.json) {
		// hash travels with the machine payload: apply seals against this diff and CI may persist it.
		ctx.ui.data({
			kind: 'DiffReport',
			formatVersion: 1,
			ok: true,
			target: url,
			profile: options.to,
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
