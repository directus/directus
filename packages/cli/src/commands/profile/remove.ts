import type { Command } from 'commander';
import { clearCredential } from '../../kernel/config/credentials.js';
import { requireConsent } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { resolveProfileName } from './utils/save.js';

interface RemoveOptions {
	readonly yes?: boolean;
}

export function registerRemove(command: Command, getContext: () => CliContext): void {
	command
		.command('remove')
		.description('Remove a profile and clear its saved credential')
		.argument('[name]', 'Profile name; prompted when omitted')
		.option('--yes', 'Skip the confirmation')
		.action((name: string | undefined, options: RemoveOptions) => remove(name, options, getContext()));
}

export async function remove(nameArg: string | undefined, options: RemoveOptions, ctx: CliContext): Promise<void> {
	const { name } = await resolveProfileName(nameArg, 'existing', 'Name the profile: d6s profile remove <name>', ctx);

	await requireConsent({
		skip: options.yes === true,
		interactive: ctx.interactive,
		question: `Remove profile "${name}" and its saved credential?`,
		refusal: `Removing profile "${name}" also clears its saved credential.`,
		refusalHint: 'Pass --yes to confirm.',
		declined: `Profile "${name}" unchanged.`,
	});

	const removed = ctx.config.removeProfile(name);
	ctx.ui.success(`Removed profile "${name}".`);

	if (removed.url !== undefined) {
		try {
			clearCredential(removed.url, name);
		} catch {
			ctx.ui.warn('Removed the profile, but could not clear its saved credential.');
		}
	}

	ctx.ui.result({ removed: name });
}
