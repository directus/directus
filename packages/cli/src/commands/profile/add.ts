import { confirm, select, text } from '@clack/prompts';
import type { Command } from 'commander';
import { existingProfileUrl, isSafeUrl, upsertProfile } from '../../kernel/config/file.js';
import { pingServer, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import { ask, orPrompt, promptLogin, promptToken, saveToken } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';

export interface AddOptions {
	readonly url?: string;
	readonly token?: string;
	readonly yes?: boolean;
}

export function registerAdd(profile: Command, getContext: () => CliContext): void {
	profile
		.command('add')
		.description('Add or update a profile (upsert)')
		.argument('[name]')
		.option('--url <url>', 'Directus instance URL')
		.option('--token <token>', 'Static token to save for this profile')
		.option('--yes', 'Skip the confirmation when repointing an existing profile to a different URL')
		.action((name: string | undefined, options: AddOptions) => add(name, options, getContext()));
}

const PROFILE_NAME = /^[A-Za-z0-9_]+$/;

export async function add(nameArg: string | undefined, options: AddOptions, ctx: CliContext): Promise<void> {
	const name = await orPrompt(nameArg, ctx.interactive, 'Name the profile: d6s profile add <name> --url <url>', {
		message: 'Profile name',
		placeholder: 'production',
		validate: (v) => (v !== undefined && PROFILE_NAME.test(v) ? undefined : 'Use letters, numbers, and underscores.'),
	});

	if (!PROFILE_NAME.test(name)) {
		throw new CliError('USAGE', `Invalid profile name: "${name}".`, {
			hint: 'Use letters, numbers, and underscores.',
		});
	}

	let url = await orPrompt(options.url, ctx.interactive, 'Provide the instance URL: --url <url>', {
		message: 'Directus URL',
		placeholder: 'https://',
		validate: (v) => (v !== undefined && isSafeUrl(v) ? undefined : 'Enter a valid http(s) URL.'),
	});

	if (!isSafeUrl(url)) throw new CliError('USAGE', 'Enter a valid http(s) URL.');

	// Repointing an existing name is where the upsert bites: the saved credential follows the profile
	// NAME, so a silent URL change would send that token to the new host on the next command. Same-URL
	// re-adds (e.g. rotating a token) and new names stay frictionless.
	const previousUrl = existingProfileUrl({ cwd: ctx.cwd, configPath: ctx.configPath }, name);

	// The stored value bypassed schema validation (a hand-edited config can hold anything, including a
	// credential-bearing URL every other command would refuse) — never interpolate it raw into output.
	const previousShown =
		previousUrl !== undefined && isSafeUrl(previousUrl) ? previousUrl : '<saved URL is invalid or unsafe to print>';

	if (previousUrl !== undefined && previousUrl !== url && options.yes !== true) {
		if (!ctx.interactive) {
			throw new CliError('USAGE', `Profile "${name}" already points at ${previousShown}.`, {
				hint: `Pass --yes to repoint it to ${url}; its saved credential will be sent to the new URL.`,
			});
		}

		const proceed = await ask(
			confirm({
				message: `Repoint "${name}" from ${previousShown} to ${url}? Its saved credential will be sent to the new URL.`,
			}),
		);

		if (!proceed) throw new CliError('USAGE', `Profile "${name}" unchanged.`);
	}

	upsertProfile({ cwd: ctx.cwd, configPath: ctx.configPath }, name, { url, auth: { type: 'token' } });

	if (previousUrl !== undefined && previousUrl !== url) {
		ctx.ui.warn(`Repointed "${name}": ${previousShown} → ${url} — its saved credential now applies to the new URL.`);
	}

	ctx.ui.success(`Saved profile "${name}" → ${url}`);

	let token = options.token;
	let credentialSaved = false;

	if (ctx.interactive) {
		const acquired = await acquireCredential(ctx, name, url, token);
		url = acquired.url;
		token = acquired.token;
		credentialSaved = acquired.credentialSaved;
	}

	if (token !== undefined) {
		saveToken(ctx.ui, url, name, token);
		credentialSaved = true;
	}

	ctx.ui.data({ name, url, credentialSaved });
}

interface Acquired {
	readonly url: string;
	readonly token: string | undefined;
	readonly credentialSaved: boolean;
}

type Recover = 'url' | 'token' | 'retry' | 'save' | 'discard';

async function acquireCredential(
	ctx: CliContext,
	name: string,
	startUrl: string,
	flagToken: string | undefined,
): Promise<Acquired> {
	let url = startUrl;
	let token = flagToken;

	if (token === undefined) {
		const method = await ask(
			select({
				message: `Add a credential for "${name}" now?`,
				options: [
					{ value: 'paste', label: 'Paste a static token' },
					{ value: 'login', label: 'Log in with email & password' },
					{ value: 'skip', label: 'Skip for now' },
				],
			}),
		);

		if (method === 'login') {
			for (;;) {
				try {
					const identity = await promptLogin(url, name);
					ctx.ui.success(`Logged in as ${identity.user}; saved a session for "${name}".`);
					return { url, token: undefined, credentialSaved: true };
				} catch (error) {
					if (!isConnectionFailure(error)) throw error;
					ctx.ui.warn(error.message);

					const next = await ask(
						select({
							message: 'How do you want to proceed?',
							options: [
								{ value: 'retry', label: 'Re-enter email & password' },
								{ value: 'url', label: 'Edit the URL' },
								{ value: 'skip', label: 'Skip for now' },
							],
						}),
					);

					if (next === 'skip') return { url, token: undefined, credentialSaved: false };
					if (next === 'url') url = await editUrl(ctx, name, url);
				}
			}
		}

		if (method === 'paste') token = await promptToken(name);
	}

	for (;;) {
		try {
			if (token !== undefined) {
				const identity = await testConnection({ url, token, kind: 'token' });
				ctx.ui.success(`Authenticated to ${url} as ${identity.user} (${identity.role}).`);
			} else {
				await pingServer(url);
			}

			return { url, token, credentialSaved: false };
		} catch (error) {
			if (!isConnectionFailure(error)) throw error;
			ctx.ui.warn(error.message);

			const next = await ask(
				select({ message: 'How do you want to proceed?', options: recoveryOptions(error, token !== undefined) }),
			);

			if (next === 'save') return { url, token, credentialSaved: false };
			if (next === 'discard') return { url, token: undefined, credentialSaved: false };
			if (next === 'url') url = await editUrl(ctx, name, url);
			if (next === 'token') token = await promptToken(name);
		}
	}
}

function recoveryOptions(error: CliError, hasToken: boolean): { value: Recover; label: string }[] {
	const editUrl = { value: 'url' as const, label: 'Edit the URL' };
	const editToken = { value: 'token' as const, label: 'Edit the token' };
	const retry = { value: 'retry' as const, label: 'Retry' };

	if (!hasToken) return [editUrl, retry, { value: 'save', label: 'Continue anyway' }];

	const edits = error.code === 'AUTH' ? [editToken, editUrl] : [editUrl, editToken];
	return [...edits, retry, { value: 'save', label: 'Save anyway' }, { value: 'discard', label: 'Discard the token' }];
}

async function editUrl(ctx: CliContext, name: string, current: string): Promise<string> {
	const url = await ask(
		text({
			message: 'Directus URL',
			initialValue: current,
			validate: (v) => (v !== undefined && isSafeUrl(v) ? undefined : 'Enter a valid http(s) URL.'),
		}),
	);

	upsertProfile({ cwd: ctx.cwd, configPath: ctx.configPath }, name, { url, auth: { type: 'token' } });

	// The user typed the new URL themselves, so no second confirmation — but this recovery path skips the
	// repoint gate above, and the credential consequence still deserves saying out loud.
	if (url !== current) {
		ctx.ui.warn(`Repointed "${name}": ${current} → ${url} — its saved credential now applies to the new URL.`);
	}

	return url;
}

function isConnectionFailure(error: unknown): error is CliError {
	return error instanceof CliError && (error.code === 'AUTH' || error.code === 'HTTP');
}
