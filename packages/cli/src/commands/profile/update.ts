import type { Command } from 'commander';
import { clearCredential, envTokenVar, renameCredential } from '../../kernel/config/credentials.js';
import { isSafeUrl } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import { requireConsent } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { assertProfileName, resolveProfileName, resolveProfileUrl, saveProfile } from './utils/save.js';

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

function urlOverwriteConsequence(name: string): string {
	return `A ${envTokenVar(name)} env token will follow the profile to the new URL; a credential saved for the old URL will be cleared.`;
}

function urlOverwriteWarning(name: string, from: string, to: string): string {
	return `Overwrote the URL of "${name}": ${from} → ${to} — ${urlOverwriteConsequence(name)}`;
}

function profileRenameConsequence(from: string, to: string): string {
	return `Its saved credential moves with it, and the env token it reads becomes ${envTokenVar(to)} instead of ${envTokenVar(from)}.`;
}

function report(
	ctx: CliContext,
	fields: { name: string; url: string | null; renamedFrom: string | null; credentialSaved: boolean },
): void {
	ctx.ui.result(fields);
}

async function rename(from: string, to: string, skipConfirmation: boolean, ctx: CliContext): Promise<void> {
	await requireConsent({
		skip: skipConfirmation,
		interactive: ctx.interactive,
		question: `Rename "${from}" to "${to}"? ${profileRenameConsequence(from, to)}`,
		refusal: `Renaming "${from}" to "${to}" also moves its saved credential.`,
		refusalHint: `Pass --yes to confirm. ${profileRenameConsequence(from, to)}`,
		declined: `Profile "${from}" unchanged.`,
	});

	const write = ctx.config.renameProfile(from, to);
	const url = write.profile.url !== undefined && isSafeUrl(write.profile.url) ? write.profile.url : undefined;

	try {
		// No usable URL means no credential key to move, so the configuration rename is the whole rename.
		if (url !== undefined) renameCredential(url, from, to);
	} catch (error) {
		write.rollback();
		throw error;
	}

	ctx.ui.success(`Renamed profile "${from}" to "${to}".`);
	ctx.ui.warn(profileRenameConsequence(from, to));
}

export async function update(nameArg: string | undefined, options: UpdateOptions, ctx: CliContext): Promise<void> {
	// A rename re-keys the profile and its credential, so combining it with a repoint would unwind two writes.
	if (options.name !== undefined && (options.url !== undefined || options.token !== undefined)) {
		throw new CliError('USAGE', 'Rename a profile on its own.', {
			hint: `d6s profile update ${nameArg ?? '<name>'} --name ${options.name}, then d6s profile update ${options.name} --url <url>`,
		});
	}

	const { name, profile: existing } = await resolveProfileName(
		nameArg,
		'existing',
		'Name the profile: d6s profile update <name> [--url <url>] [--token <token>]',
		ctx,
	);

	// Raw configuration may contain credentials or terminal controls, so only display a validated URL.
	const currentUrl = existing.url !== undefined && isSafeUrl(existing.url) ? existing.url : undefined;
	const currentShown = currentUrl ?? UNPRINTABLE_URL;

	if (options.name !== undefined) {
		if (options.name === name) throw new CliError('USAGE', `Profile "${name}" already has that name.`);

		assertProfileName(
			options.name,
			'new',
			ctx,
			`Pick a free name, or remove that one first: d6s profile remove ${options.name}`,
		);

		await rename(name, options.name, options.yes === true, ctx);
		report(ctx, { name: options.name, url: currentUrl ?? null, renamedFrom: name, credentialSaved: false });
		return;
	}

	const requestedUrl = await resolveProfileUrl(options.url, currentUrl, 'Provide the instance URL: --url <url>', ctx);

	// Confirm before gathering credentials so a rejected move wastes no input.
	if (requestedUrl !== existing.url) {
		await requireConsent({
			skip: options.yes === true,
			interactive: ctx.interactive,
			question: `Overwrite the URL of "${name}" — ${currentShown} → ${requestedUrl}? ${urlOverwriteConsequence(name)}`,
			refusal: `Profile "${name}" already points at ${currentShown}.`,
			refusalHint: `Pass --yes to overwrite its URL with ${requestedUrl}. ${urlOverwriteConsequence(name)}`,
			declined: `Profile "${name}" unchanged.`,
		});
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

		ctx.ui.warn(urlOverwriteWarning(name, currentShown, saved.url));
	}

	report(ctx, { name, url: saved.url, renamedFrom: null, credentialSaved: saved.credentialSaved });
}
