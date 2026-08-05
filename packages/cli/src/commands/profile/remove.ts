import { confirm } from '@clack/prompts';
import type { Command } from 'commander';
import { clearCredential } from '../../kernel/config/credentials.js';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { resolveExistingProfileName } from '../../profile/save.js';

interface RemoveOptions {
	readonly yes?: boolean;
}

export function registerRemove(profile: Command, getContext: () => CliContext): void {
	profile
		.command('remove')
		.description('Remove a profile and clear its saved credential')
		.argument('[name]', 'Profile name; prompted when omitted')
		.option('--yes', 'Skip the confirmation')
		.action((name: string | undefined, options: RemoveOptions) => remove(name, options, getContext()));
}

export async function remove(nameArg: string | undefined, options: RemoveOptions, ctx: CliContext): Promise<void> {
	const name = await resolveExistingProfileName(nameArg, 'Name the profile: d6s profile remove <name>', ctx);

	// Cheapest precondition first, like add and update: never ask to confirm a removal that cannot happen.
	if (ctx.config.existingProfile(name) === undefined) {
		throw new CliError('USAGE', `Unknown profile: "${name}"`, { hint: 'See what exists: d6s profile list' });
	}

	// Confirm before any write so a mistyped name changes nothing.
	if (options.yes !== true) {
		if (!ctx.interactive) {
			throw new CliError('USAGE', `Removing profile "${name}" also clears its saved credential.`, {
				hint: 'Pass --yes to confirm.',
			});
		}

		const proceed = await ask(confirm({ message: `Remove profile "${name}" and its saved credential?` }));

		if (!proceed) throw new CliError('USAGE', `Profile "${name}" unchanged.`);
	}

	const url = ctx.config.removeProfile(name);
	ctx.ui.success(`Removed profile "${name}".`);

	if (url !== undefined) {
		try {
			clearCredential(url, name);
		} catch {
			ctx.ui.warn('Removed the profile, but could not clear its saved credential.');
		}
	}

	ctx.ui.data({ kind: 'ProfileRemoveReport', formatVersion: 1, ok: true, removed: name });
}
