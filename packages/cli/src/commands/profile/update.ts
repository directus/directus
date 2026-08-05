import { confirm } from '@clack/prompts';
import type { Command } from 'commander';
import { clearCredential, envTokenVar } from '../../kernel/config/credentials.js';
import { isSafeUrl } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { resolveProfileName, resolveProfileUrl, saveProfile } from '../../profile/save.js';

interface UpdateOptions {
	readonly url?: string;
	readonly token?: string;
	readonly yes?: boolean;
}

export function registerUpdate(profile: Command, getContext: () => CliContext): void {
	profile
		.command('update')
		.description(
			'Change an existing profile. A different --url moves it to another host: the credential saved for the old URL is cleared and the profile-specific env token follows the profile',
		)
		.argument('[name]', 'Profile name; prompted when omitted')
		.option('--url <url>', 'New Directus instance URL; keeps the current one when omitted')
		.option('--token <token>', 'Static token to save for this profile, replacing any saved credential')
		.option('--yes', 'Skip the confirmation when changing the URL')
		.action((name: string | undefined, options: UpdateOptions) => update(name, options, getContext()));
}

const UNPRINTABLE_URL = '<saved URL is invalid or unsafe to print>';

function overwriteConsequence(name: string): string {
	return `A ${envTokenVar(name)} env token will follow the profile to the new URL; a credential saved for the old URL will be cleared.`;
}

function overwriteWarning(name: string, from: string, to: string): string {
	return `Overwrote the URL of "${name}": ${from} → ${to} — ${overwriteConsequence(name)}`;
}

export async function update(nameArg: string | undefined, options: UpdateOptions, ctx: CliContext): Promise<void> {
	const name = await resolveProfileName(
		nameArg,
		'Name the profile: d6s profile update <name> [--url <url>] [--token <token>]',
		ctx,
	);

	const existing = ctx.config.existingProfile(name);

	if (existing === undefined) {
		throw new CliError('USAGE', `Unknown profile: "${name}"`, {
			hint: `Create it first: d6s profile add ${name} --url <url>`,
		});
	}

	// Raw config may contain credentials or terminal controls, so only display a validated URL.
	const currentUrl = existing.url !== undefined && isSafeUrl(existing.url) ? existing.url : undefined;
	const currentShown = currentUrl ?? UNPRINTABLE_URL;

	const requestedUrl = await resolveProfileUrl(options.url, currentUrl, 'Provide the instance URL: --url <url>', ctx);

	// Confirm before gathering credentials so a rejected move wastes no input.
	if (requestedUrl !== existing.url && options.yes !== true) {
		if (!ctx.interactive) {
			throw new CliError('USAGE', `Profile "${name}" already points at ${currentShown}.`, {
				hint: `Pass --yes to overwrite its URL with ${requestedUrl}. ${overwriteConsequence(name)}`,
			});
		}

		const proceed = await ask(
			confirm({
				message: `Overwrite the URL of "${name}" — ${currentShown} → ${requestedUrl}? ${overwriteConsequence(name)}`,
			}),
		);

		if (!proceed) throw new CliError('USAGE', `Profile "${name}" unchanged.`);
	}

	const saved = await saveProfile(name, requestedUrl, options.token, ctx);

	if (saved.url !== existing.url) {
		if (existing.url !== undefined) {
			try {
				clearCredential(existing.url, name);
			} catch {
				ctx.ui.warn('Updated the profile, but could not clear its credential saved for the old URL.');
			}
		}

		ctx.ui.warn(overwriteWarning(name, currentShown, saved.url));
	}

	ctx.ui.data({
		kind: 'ProfileUpdateReport',
		formatVersion: 1,
		ok: true,
		name,
		url: saved.url,
		credentialSaved: saved.credentialSaved,
	});
}
