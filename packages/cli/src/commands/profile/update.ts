import { confirm } from '@clack/prompts';
import type { Command } from 'commander';
import { clearCredential, envTokenVar, renameCredential } from '../../kernel/config/credentials.js';
import { isSafeUrl } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { assertProfileName, resolveExistingProfileName, resolveProfileUrl, saveProfile } from './utils/save.js';

interface UpdateOptions {
	readonly name?: string;
	readonly url?: string;
	readonly token?: string;
	readonly yes?: boolean;
}

export function registerUpdate(command: Command, getContext: () => CliContext): void {
	command
		.command('update')
		.description(
			'Change an existing profile. A different --url moves it to another instance: the credential saved for the old URL is cleared and the profile-specific env token follows the profile',
		)
		.argument('[name]', 'Profile name; prompted when omitted')
		.option(
			'--name <name>',
			'Rename the profile, moving its saved credential and env token name with it; not combinable with --url or --token',
		)
		.option('--url <url>', 'New Directus instance URL; keeps the current one when omitted')
		.option('--token <token>', 'Static token to save for this profile, replacing any saved credential')
		.option('--yes', 'Skip the confirmation when changing the name or URL')
		.action((name: string | undefined, options: UpdateOptions) => update(name, options, getContext()));
}

const UNPRINTABLE_URL = '<saved URL is invalid or unsafe to print>';

function overwriteConsequence(name: string): string {
	return `A ${envTokenVar(name)} env token will follow the profile to the new URL; a credential saved for the old URL will be cleared.`;
}

function overwriteWarning(name: string, from: string, to: string): string {
	return `Overwrote the URL of "${name}": ${from} → ${to} — ${overwriteConsequence(name)}`;
}

function renameConsequence(from: string, to: string): string {
	return `Its saved credential moves with it, and the env token it reads becomes ${envTokenVar(to)} instead of ${envTokenVar(from)}.`;
}

/** Both outcomes report the same shape, so a consumer never has to branch on which one ran. */
function report(
	ctx: CliContext,
	fields: { name: string; url: string | null; renamedFrom: string | null; credentialSaved: boolean },
): void {
	ctx.ui.data({ kind: 'ProfileUpdateReport', ok: true, ...fields });
}

/**
 * Re-key the profile and its credential together. Credentials are keyed by URL and profile name, so moving
 * only the profile would strand the credential under a name nothing looks up — hence the rollback.
 */
async function rename(
	from: string,
	to: string,
	url: string | undefined,
	skipConfirmation: boolean,
	ctx: CliContext,
): Promise<void> {
	assertProfileName(to);

	if (ctx.config.existingProfile(to) !== undefined) {
		throw new CliError('USAGE', `Profile "${to}" already exists.`, {
			hint: `Pick a free name, or remove that one first: d6s profile remove ${to}`,
		});
	}

	if (!skipConfirmation) {
		if (!ctx.interactive) {
			throw new CliError('USAGE', `Renaming "${from}" to "${to}" also moves its saved credential.`, {
				hint: `Pass --yes to confirm. ${renameConsequence(from, to)}`,
			});
		}

		const proceed = await ask(confirm({ message: `Rename "${from}" to "${to}"? ${renameConsequence(from, to)}` }));

		if (!proceed) throw new CliError('USAGE', `Profile "${from}" unchanged.`);
	}

	const restoreConfig = ctx.config.renameProfile(from, to);

	try {
		// A profile with no usable URL has no credential key to move; the configuration rename is the whole rename.
		if (url !== undefined) renameCredential(url, from, to);
	} catch (error) {
		restoreConfig();
		throw error;
	}

	ctx.ui.success(`Renamed profile "${from}" to "${to}".`);
	ctx.ui.warn(renameConsequence(from, to));
}

export async function update(nameArg: string | undefined, options: UpdateOptions, ctx: CliContext): Promise<void> {
	const name = await resolveExistingProfileName(
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

	// Raw configuration may contain credentials or terminal controls, so only display a validated URL.
	const currentUrl = existing.url !== undefined && isSafeUrl(existing.url) ? existing.url : undefined;
	const currentShown = currentUrl ?? UNPRINTABLE_URL;

	// A rename re-keys the profile and its credential; a repoint rewrites the value under an unchanged key.
	// Keeping them to separate invocations means neither has to unwind the other when it fails.
	if (options.name !== undefined) {
		if (options.url !== undefined || options.token !== undefined) {
			throw new CliError('USAGE', 'Rename a profile on its own.', {
				hint: `d6s profile update ${name} --name ${options.name}, then d6s profile update ${options.name} --url <url>`,
			});
		}

		if (options.name === name) throw new CliError('USAGE', `Profile "${name}" already has that name.`);

		await rename(name, options.name, currentUrl, options.yes === true, ctx);
		report(ctx, { name: options.name, url: currentUrl ?? null, renamedFrom: name, credentialSaved: false });
		return;
	}

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

	report(ctx, { name, url: saved.url, renamedFrom: null, credentialSaved: saved.credentialSaved });
}
