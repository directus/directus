import { select, text } from '@clack/prompts';
import { z } from 'zod';
import type { CliContext, CommandContext, CommandDefinition } from '../../kernel/command.js';
import { isSafeUrl, upsertProfile } from '../../kernel/config/file.js';
import { pingServer, testConnection } from '../../kernel/connection.js';
import { CliError, isCliError } from '../../kernel/error.js';
import { ask, orPrompt, promptLogin, promptToken, saveToken } from '../../kernel/prompt.js';

const schema = z.object({
	// Refined so a `--url` flag can't smuggle a credential-bearing URL past the
	// prompt validator and into committable config.
	url: z
		.url()
		.refine(isSafeUrl, 'Use an http(s) URL with no credentials, query, or fragment.')
		.optional()
		.describe('Directus instance URL'),
	token: z.string().optional().describe('Static token to save for this profile'),
});

type Location = Parameters<typeof upsertProfile>[0];

// A profile name keys both the config and its DIRECTUS_<NAME>_TOKEN env var, so it
// must be a valid POSIX env-var segment — letters, digits, underscores only. This
// also sidesteps separator collisions (`my-staging` vs `my.staging`).
const PROFILE_NAME = /^[A-Za-z0-9_]+$/;

export const add: CommandDefinition = {
	name: 'add',
	description: 'Add or update a profile (upsert)',
	args: schema,
	async run({ args, positionals, ctx }: CommandContext<z.infer<typeof schema>>) {
		const name = await orPrompt(
			positionals[0],
			ctx.interactive,
			'Name the profile: d6s profile add <name> --url <url>',
			{
				message: 'Profile name',
				placeholder: 'production',
				validate: (v) => (v && PROFILE_NAME.test(v) ? undefined : 'Use letters, numbers, and underscores.'),
			},
		);

		// The prompt validates, but a name passed as a positional does not go through
		// it — guard the value itself.
		if (!PROFILE_NAME.test(name)) {
			throw new CliError('USAGE', `Invalid profile name: "${name}".`, {
				hint: 'Use letters, numbers, and underscores.',
			});
		}

		const location: Location = {
			cwd: ctx.cwd,
			...(ctx.configPath !== undefined ? { configPath: ctx.configPath } : {}),
		};

		let url = await orPrompt(args.url, ctx.interactive, 'Provide the instance URL: --url <url>', {
			message: 'Directus URL',
			placeholder: 'https://',
			validate: (v) => (v && isSafeUrl(v) ? undefined : 'Enter a valid http(s) URL.'),
		});

		upsertProfile(location, name, { url, auth: { type: 'token' } });
		ctx.ui.success(`Saved profile "${name}" → ${url}`);

		let token = args.token;
		let credentialSaved = false;

		// All pre-flight checks and their recovery prompts are interactive-only — CI
		// stays token-only and side-effect-free (no --email/--password, no network).
		if (ctx.interactive) {
			const acquired = await acquire(ctx, location, name, url, token);
			url = acquired.url;
			token = acquired.token;
			credentialSaved = acquired.sessionSaved;
		}

		if (token !== undefined) {
			saveToken(ctx.ui, url, name, token);
			credentialSaved = true;
		}

		ctx.ui.data({ name, url, credentialSaved });
	},
};

interface Acquired {
	readonly url: string;
	readonly token: string | undefined;
	readonly sessionSaved: boolean;
}

// Interactively obtain and verify a credential, with an in-place recovery loop: a
// failed reachability/auth check lets the user fix the URL or token, retry, save
// anyway, or discard — so a typo never forces re-running the whole command. The URL
// may be edited here, so the resolved one is returned for the caller to persist.
async function acquire(
	ctx: CliContext,
	location: Location,
	name: string,
	startUrl: string,
	flagToken: string | undefined,
): Promise<Acquired> {
	let url = startUrl;
	let token = flagToken;

	// No --token supplied: choose how (or whether) to add one. Login has its own
	// loop (it persists a session, not a token); paste and skip fall through to the
	// shared verify loop below, which probes reachability when there is no token.
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
					return { url, token: undefined, sessionSaved: true };
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

					if (next === 'skip') return { url, token: undefined, sessionSaved: false };
					if (next === 'url') url = await editUrl(location, name, url);
				}
			}
		}

		if (method === 'paste') token = await promptToken(name);
	}

	// Prove the token end-to-end before persisting — or, with no token (skip), probe
	// reachability so a URL typo still surfaces now instead of on the first request.
	for (;;) {
		try {
			if (token !== undefined) {
				const identity = await testConnection({ url, token, source: 'prompt' });
				ctx.ui.success(`Authenticated to ${url} as ${identity.user} (${identity.role}).`);
			} else {
				await pingServer(url);
			}

			return { url, token, sessionSaved: false };
		} catch (error) {
			if (!isConnectionFailure(error)) throw error;
			ctx.ui.warn(error.message);

			const next = await ask(
				select({ message: 'How do you want to proceed?', options: recoveryOptions(error, token !== undefined) }),
			);

			if (next === 'save') return { url, token, sessionSaved: false };
			if (next === 'discard') return { url, token: undefined, sessionSaved: false };
			if (next === 'url') url = await editUrl(location, name, url);
			if (next === 'token') token = await promptToken(name);
		}
	}
}

type Recover = 'url' | 'token' | 'retry' | 'save' | 'discard';

// Recovery choices after a failed check, ordered so the likely fix leads: a
// rejected token points at the token, an unreachable host at the URL.
function recoveryOptions(error: CliError, hasToken: boolean): { value: Recover; label: string }[] {
	const editUrl = { value: 'url' as const, label: 'Edit the URL' };
	const editToken = { value: 'token' as const, label: 'Edit the token' };
	const retry = { value: 'retry' as const, label: 'Retry' };

	// No token to edit or discard: reachability-only recovery.
	if (!hasToken) return [editUrl, retry, { value: 'save', label: 'Continue anyway' }];

	const edits = error.code === 'AUTH' ? [editToken, editUrl] : [editUrl, editToken];
	return [...edits, retry, { value: 'save', label: 'Save anyway' }, { value: 'discard', label: 'Discard the token' }];
}

// Re-prompt for the URL (prefilled) and re-upsert the profile so its stored URL
// tracks the correction immediately.
async function editUrl(location: Location, name: string, current: string): Promise<string> {
	const url = await ask(
		text({
			message: 'Directus URL',
			initialValue: current,
			validate: (v) => (v && isSafeUrl(v) ? undefined : 'Enter a valid http(s) URL.'),
		}),
	);

	upsertProfile(location, name, { url, auth: { type: 'token' } });
	return url;
}

// Only a reachability/auth failure opens the recovery menu; a cancel (USAGE) or any
// unexpected error aborts the command.
function isConnectionFailure(error: unknown): error is CliError {
	return isCliError(error) && (error.code === 'AUTH' || error.code === 'HTTP');
}
