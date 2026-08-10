import { select, text } from '@clack/prompts';
import type { AuthenticationData } from '@directus/sdk';
import { credentialStorage, saveCredential, savedTokenMessage } from '../../../kernel/config/credentials.js';
import { INVALID_URL_MESSAGE, isSafeUrl } from '../../../kernel/config/file.js';
import { loginSession, pingServer, testConnection } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import { ask, orPrompt, promptAndRegisterToken, promptLogin } from '../../../kernel/prompt.js';
import type { CliContext } from '../../../kernel/run.js';

// The name becomes part of DIRECTUS_<NAME>_TOKEN, so it has to stay a valid environment variable segment.
const PROFILE_NAME = /^[A-Za-z0-9_]+$/;
const PROFILE_NAME_RULE = 'Use letters, numbers, and underscores.';
type ProfileNamePolicy = 'new' | 'existing';
type StoredProfile = NonNullable<ReturnType<CliContext['config']['existingProfile']>>;

/** Assert the creation or lookup rules for a profile name, returning the stored profile when one must exist. */
export function assertProfileName(name: string, policy: 'new', ctx: CliContext, hint?: string): void;
export function assertProfileName(name: string, policy: 'existing', ctx: CliContext, hint?: string): StoredProfile;
export function assertProfileName(
	name: string,
	policy: ProfileNamePolicy,
	ctx: CliContext,
	hint?: string,
): StoredProfile | undefined {
	if (policy === 'new' && !PROFILE_NAME.test(name)) {
		throw new CliError('USAGE', `Invalid profile name: "${name}".`, { hint: PROFILE_NAME_RULE });
	}

	const profile = ctx.config.existingProfile(name);

	if (policy === 'new' && profile !== undefined) {
		throw new CliError('USAGE', `Profile "${name}" already exists.`, {
			hint: hint ?? `Change it instead: d6s profile update ${name} --url <url>`,
		});
	}

	if (policy === 'existing' && profile === undefined) {
		throw new CliError('USAGE', `Unknown profile: "${name}"`, {
			hint: hint ?? 'See what exists: d6s profile list',
		});
	}

	return profile;
}

interface ResolvedNewProfileName {
	readonly name: string;
	readonly profile: undefined;
}

interface ResolvedExistingProfileName {
	readonly name: string;
	readonly profile: StoredProfile;
}

function profileNameValidationMessage(
	value: string | undefined,
	policy: ProfileNamePolicy,
	ctx: CliContext,
): string | undefined {
	if (value === undefined) return policy === 'new' ? PROFILE_NAME_RULE : 'Enter a profile name.';

	try {
		if (policy === 'new') assertProfileName(value, policy, ctx);
		else assertProfileName(value, policy, ctx);

		return undefined;
	} catch (error) {
		if (error instanceof CliError && error.code === 'USAGE') return error.message;
		throw error;
	}
}

/**
 * Resolve the profile name from the argument or a prompt. Creating a profile ('new') rejects names no
 * environment variable could carry; resolving an existing key accepts hand-written configuration as-is.
 */
export function resolveProfileName(
	nameArg: string | undefined,
	policy: 'new',
	usage: string,
	ctx: CliContext,
): Promise<ResolvedNewProfileName>;
export function resolveProfileName(
	nameArg: string | undefined,
	policy: 'existing',
	usage: string,
	ctx: CliContext,
): Promise<ResolvedExistingProfileName>;
export async function resolveProfileName(
	nameArg: string | undefined,
	policy: ProfileNamePolicy,
	usage: string,
	ctx: CliContext,
): Promise<ResolvedNewProfileName | ResolvedExistingProfileName> {
	const name = await orPrompt(nameArg, ctx.interactive, usage, {
		message: 'Profile name',
		placeholder: 'production',
		validate: (value) => profileNameValidationMessage(value, policy, ctx),
	});

	if (policy === 'new') {
		assertProfileName(name, policy, ctx);
		return { name, profile: undefined };
	}

	return { name, profile: assertProfileName(name, policy, ctx) };
}

/**
 * Resolve the instance URL from `--url` or a prompt. `currentUrl` is the URL the profile already has: it
 * seeds the prompt and is what the profile keeps when the flag is omitted, so only a profile without a
 * usable URL of its own makes `--url` mandatory.
 */
export async function resolveProfileUrl(
	urlFlag: string | undefined,
	currentUrl: string | undefined,
	usage: string,
	ctx: CliContext,
): Promise<string> {
	// With a terminal the saved URL is only where the prompt starts; without one it is the answer.
	const kept = ctx.interactive ? undefined : currentUrl;

	const url = await orPrompt(urlFlag ?? kept, ctx.interactive, usage, {
		message: 'Directus URL',
		...(currentUrl !== undefined ? { initialValue: currentUrl } : { placeholder: 'https://' }),
		validate: (value) => (value !== undefined && isSafeUrl(value) ? undefined : INVALID_URL_MESSAGE),
	});

	if (!isSafeUrl(url)) throw new CliError('USAGE', INVALID_URL_MESSAGE);

	return url;
}

export interface SavedProfile {
	/** The URL actually written: interactive recovery can settle on a different one than the caller resolved. */
	readonly url: string;
	readonly credentialSaved: boolean;
}

/**
 * Verify a credential, then write the profile followed by its credential. A credential failure restores the
 * previous configuration; if that second write also fails, the caller gets both failures and a partial-state warning.
 */
export async function saveProfile(
	name: string,
	requestedUrl: string,
	flagToken: string | undefined,
	ctx: CliContext,
): Promise<SavedProfile> {
	let url = requestedUrl;
	let token = flagToken;
	let session: AuthenticationData | undefined;

	if (ctx.interactive) {
		const acquired = await acquireCredential(name, url, token, ctx);
		url = acquired.url;
		token = acquired.token;
		session = acquired.session;
	}

	const write = ctx.config.upsertProfile(name, { url, auth: { type: 'token' } });

	try {
		if (session !== undefined) credentialStorage(url, name).set(session);
		if (token !== undefined) saveCredential(url, name, token);
	} catch (error) {
		try {
			write.rollback();
		} catch (rollbackError) {
			// Restoring configuration is another filesystem write that can fail independently. Preserve both
			// errors so the operator knows the profile may still point at the new URL.
			const credentialMessage = error instanceof Error ? error.message : String(error);
			const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

			throw new CliError(
				'STATE',
				'Could not save the profile credential, and restoring the previous profile also failed.',
				{
					hint: 'The profile may be partially updated. Inspect the configuration and credential store before retrying.',
					detail: `Credential error: ${credentialMessage}\nRollback error: ${rollbackMessage}`,
				},
			);
		}

		throw error;
	}

	ctx.ui.success(`Saved profile "${name}" → ${url}`);
	if (session !== undefined) ctx.ui.success(`Saved a session for "${name}" to the credential store.`);
	if (token !== undefined) ctx.ui.success(savedTokenMessage(name));

	return { url: write.profile.url, credentialSaved: session !== undefined || token !== undefined };
}

type Acquired =
	| { readonly url: string; readonly token: string; readonly session?: never }
	| { readonly url: string; readonly token?: never; readonly session: AuthenticationData }
	| { readonly url: string; readonly token?: never; readonly session?: never };

type Recover = 'url' | 'token' | 'retry' | 'save' | 'discard';

async function acquireCredential(
	name: string,
	startUrl: string,
	flagToken: string | undefined,
	ctx: CliContext,
): Promise<Acquired> {
	let url = startUrl;
	let token = flagToken;

	// A profile is a named URL, not a credential: tokens also resolve from DIRECTUS_<NAME>_TOKEN and the
	// credential store, so skipping here is how you create a profile whose secret only ever lives in CI.
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
			while (true) {
				try {
					const { email, password } = await promptLogin();
					const { identity, session } = await loginSession(url, email, password);
					ctx.ui.success(`Logged in to ${url} as ${identity.user} (${identity.role}).`);
					return { url, session };
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

					if (next === 'skip') return { url };
					if (next === 'url') url = await editUrl(url);
				}
			}
		}

		if (method === 'paste') token = await promptAndRegisterToken(name);
	}

	while (true) {
		try {
			if (token !== undefined) {
				const identity = await testConnection({ url, token, kind: 'token' });
				ctx.ui.success(`Authenticated to ${url} as ${identity.user} (${identity.role}).`);
			} else {
				// No token to authenticate with, but the URL is about to be committed — ping so a typo or an
				// unreachable host is caught here, while it is still one keystroke to fix, not on first sync.
				await pingServer(url);
			}

			return token === undefined ? { url } : { url, token };
		} catch (error) {
			if (!isConnectionFailure(error)) throw error;
			ctx.ui.warn(error.message);

			const editUrlOption = { value: 'url' as const, label: 'Edit the URL' };
			const editToken = { value: 'token' as const, label: 'Edit the token' };
			const retry = { value: 'retry' as const, label: 'Retry' };

			// Lead with the field the failure implicates, so the likely fix is the default choice.
			const options: { value: Recover; label: string }[] =
				token === undefined
					? [editUrlOption, retry, { value: 'save', label: 'Continue anyway' }]
					: [
							...(error.code === 'AUTH' ? [editToken, editUrlOption] : [editUrlOption, editToken]),
							retry,
							{ value: 'save', label: 'Save anyway' },
							{ value: 'discard', label: 'Discard the token' },
						];

			// A cancel here (the only error these prompts throw) escapes the loop on purpose:
			// Ctrl+C must abort the command, not land back in this menu.
			const next = await ask(select({ message: 'How do you want to proceed?', options }));

			if (next === 'save') return token === undefined ? { url } : { url, token };
			if (next === 'discard') return { url };
			if (next === 'url') url = await editUrl(url);
			if (next === 'token') token = await promptAndRegisterToken(name);
		}
	}
}

async function editUrl(current: string): Promise<string> {
	return ask(
		text({
			message: 'Directus URL',
			initialValue: current,
			validate: (v) => (v !== undefined && isSafeUrl(v) ? undefined : INVALID_URL_MESSAGE),
		}),
	);
}

function isConnectionFailure(error: unknown): error is CliError {
	return error instanceof CliError && (error.code === 'AUTH' || error.code === 'HTTP');
}
