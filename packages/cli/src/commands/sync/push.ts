import { confirm, text } from '@clack/prompts';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { applyDiff } from '../../sync/api.js';
import { summarizeDiff } from '../../sync/render.js';
import { localDiff } from './local-diff.js';
import { resolveTarget } from './resolve-target.js';

export interface PushOptions {
	readonly to: string;
	readonly mode: 'merge' | 'mirror';
	readonly allowDeletes?: boolean;
	readonly yes?: boolean;
}

export async function push(options: PushOptions, ctx: CliContext): Promise<void> {
	const target = resolveTarget(options.to, ctx);
	const { url, credential } = target;

	const { result } = await localDiff(target, options.mode);

	// A no-op push is the command's answer, not a failure: exit 0 and never reach an apply call.
	if (result === null) {
		if (ctx.ui.json) {
			ctx.ui.data({
				ok: true,
				target: url,
				mode: options.mode,
				applied: false,
				changes: false,
				added: 0,
				modified: 0,
				deleted: 0,
				hash: null,
			});

			return;
		}

		ctx.ui.success(`No schema changes to push to ${url}.`);
		return;
	}

	const { added, modified, deleted, lines } = summarizeDiff(result.diff);
	const total = added + modified + deleted;

	// Always render the summary before any gate — this is the push's dry-run view, so the operator (or
	// the CI log) sees exactly what would change before a prompt or a refusal. --json stays silent here;
	// its machine payload lands at the end, or the error surfaces through the boundary.
	if (!ctx.ui.json) {
		ctx.ui.info(`${total} schema ${total === 1 ? 'change' : 'changes'} to push to ${url}:`);
		for (const line of lines) ctx.ui.print(line);
	}

	const allowDeletes = options.allowDeletes ?? false;
	const yes = options.yes ?? false;

	// The invariant across every gate: --yes never authorizes deletions. Deletions require either
	// --allow-deletes (the CI consent) or the interactive typed confirmation (the human consent).

	// Checked first so a non-interactive caller gets the deletion-specific message before the generic
	// missing-confirmation one — the fix it needs is --allow-deletes, not --yes.
	if (deleted > 0 && !allowDeletes && !ctx.interactive) {
		throw new CliError('USAGE', `This push includes ${deleted} deletion${deleted === 1 ? '' : 's'}.`, {
			hint: 'Pass --allow-deletes to include deletions, or use --mode merge.',
		});
	}

	if (!ctx.interactive && !yes) {
		throw new CliError('USAGE', 'Refusing to apply schema changes without confirmation.', {
			hint: 'Pass --yes to apply in a non-interactive context.',
		});
	}

	if (ctx.interactive && !yes) {
		const proceed = await ask(
			confirm({ message: `Apply ${total} schema ${total === 1 ? 'change' : 'changes'} to ${url}?` }),
		);

		if (!proceed) throw new CliError('USAGE', 'Push aborted; nothing was applied.');
	}

	// The last gate before the act: an interactive deletion the operator did not pre-authorize with
	// --allow-deletes must be typed out in full. --yes cannot reach past this — the invariant holds.
	if (deleted > 0 && !allowDeletes && ctx.interactive) {
		const typed = await ask(
			text({
				message: `This push DELETES ${deleted} item${deleted === 1 ? '' : 's'} and deleted data cannot be restored. Type "${options.to}" to confirm:`,
			}),
		);

		if (typed !== options.to) {
			throw new CliError('USAGE', 'Confirmation did not match; nothing was applied.');
		}
	}

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

	if (ctx.ui.json) {
		ctx.ui.data({
			ok: true,
			target: url,
			mode: options.mode,
			applied: true,
			changes: true,
			added,
			modified,
			deleted,
			hash: result.hash,
		});

		return;
	}

	ctx.ui.success(`Applied ${total} schema ${total === 1 ? 'change' : 'changes'} to ${url}; schema hash verified.`);
}
