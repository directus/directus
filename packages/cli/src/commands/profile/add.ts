import type { Command } from 'commander';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { resolveProfileName, resolveProfileUrl, saveProfile } from '../../profile/save.js';

interface AddOptions {
	readonly url?: string;
	readonly token?: string;
}

export function registerAdd(profile: Command, getContext: () => CliContext): void {
	profile
		.command('add')
		.description('Create a profile; use "profile update" to change one that already exists')
		.argument('[name]', 'Profile name; prompted when omitted')
		.option('--url <url>', 'Directus instance URL; prompted when omitted')
		.option('--token <token>', 'Static token to save for this profile')
		.action((name: string | undefined, options: AddOptions) => add(name, options, getContext()));
}

export async function add(nameArg: string | undefined, options: AddOptions, ctx: CliContext): Promise<void> {
	const name = await resolveProfileName(nameArg, 'Name the profile: d6s profile add <name> --url <url>', ctx);

	// Cheapest precondition first: a taken name creates nothing, so ask for no further input.
	if (ctx.config.existingProfile(name) !== undefined) {
		throw new CliError('USAGE', `Profile "${name}" already exists.`, {
			hint: `Change it instead: d6s profile update ${name} --url <url>`,
		});
	}

	const url = await resolveProfileUrl(options.url, undefined, 'Provide the instance URL: --url <url>', ctx);
	const saved = await saveProfile(name, url, options.token, ctx);

	ctx.ui.data({
		kind: 'ProfileAddReport',
		formatVersion: 1,
		ok: true,
		name,
		url: saved.url,
		credentialSaved: saved.credentialSaved,
	});
}
