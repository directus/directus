import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { resolveProfileName, resolveProfileUrl, saveProfile } from './utils/save.js';

interface AddOptions {
	readonly url?: string;
	readonly token?: string;
}

export function registerAdd(command: Command, getContext: () => CliContext): void {
	command
		.command('add')
		.description('Create a profile; use "profile update" to change one that already exists')
		.argument('[name]', 'Profile name; prompted when omitted')
		.option('--url <url>', 'Directus instance URL; prompted when omitted')
		.option('--token <token>', 'Static token to save for this profile')
		.action((name: string | undefined, options: AddOptions) => add(name, options, getContext()));
}

export async function add(nameArg: string | undefined, options: AddOptions, ctx: CliContext): Promise<void> {
	const { name } = await resolveProfileName(
		nameArg,
		'new',
		'Name the profile: d6s profile add <name> --url <url>',
		ctx,
	);

	const url = await resolveProfileUrl(options.url, undefined, 'Provide the instance URL: --url <url>', ctx);
	const saved = await saveProfile(name, url, options.token, ctx);

	ctx.ui.result({
		name,
		url: saved.url,
		credentialSaved: saved.credentialSaved,
	});
}
