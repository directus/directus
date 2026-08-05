import { confirm, select } from '@clack/prompts';
import type { Command } from 'commander';
import {
	credentialStorage,
	envTokenVar,
	resolveCredential,
	saveCredential,
	savedTokenMessage,
} from '../../kernel/config/credentials.js';
import { INVALID_URL_MESSAGE, isSafeUrl, resolveProfile } from '../../kernel/config/file.js';
import { type Identity, loginSession, refreshSessionIfNeeded, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import { ask, orPrompt, promptLogin, promptToken } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';

interface TestOptions {
	readonly url?: string;
	readonly token?: string;
}

export function registerTest(profile: Command, getContext: () => CliContext): void {
	profile
		.command('test')
		.description('Verify a profile can authenticate. Name a profile or pass --url — one is required, never both')
		.argument('[name]', 'Profile name; prompted when omitted and no --url is given')
		.option('--url <url>', 'Test a URL directly, without a profile or config file')
		.option('--token <token>', 'Override the resolved token')
		.action((name: string | undefined, options: TestOptions) => testProfile(name, options, getContext()));
}

export async function testProfile(nameArg: string | undefined, options: TestOptions, ctx: CliContext): Promise<void> {
	if (nameArg !== undefined && options.url !== undefined) {
		throw new CliError('USAGE', 'Pass a profile name or --url, not both.');
	}

	let name = nameArg;
	let url: string;

	if (options.url !== undefined) {
		if (!isSafeUrl(options.url)) throw new CliError('USAGE', INVALID_URL_MESSAGE);
		url = options.url;
	} else {
		name = await orPrompt(
			nameArg,
			ctx.interactive,
			'Name the profile: d6s profile test <name>',
			{ message: 'Profile name', placeholder: 'production' },
			'Or test without one: d6s profile test --url <url> --token <token>',
		);

		url = resolveProfile(ctx.config.require().config, name).url;
	}

	const credential = resolveCredential(
		name !== undefined
			? {
					target: 'profile',
					url,
					profileName: name,
					...(options.token !== undefined ? { tokenFlag: options.token } : {}),
				}
			: { target: 'url', url, ...(options.token !== undefined ? { tokenFlag: options.token } : {}) },
	);

	let identity: Identity;

	if (credential !== undefined) {
		await refreshSessionIfNeeded(credential);
		identity = await testConnection(credential);
	} else if (!ctx.interactive) {
		throw new CliError('AUTH', `No token found for ${name !== undefined ? `"${name}"` : url}.`, {
			hint: name !== undefined ? `Set ${envTokenVar(name)} or pass --token.` : 'Pass --token to test a URL directly.',
		});
	} else {
		const method =
			name !== undefined
				? await ask(
						select({
							message: 'No credential found. How do you want to authenticate?',
							options: [
								{ value: 'paste', label: 'Paste a static token' },
								{ value: 'login', label: 'Log in with email & password' },
							],
						}),
					)
				: 'paste';

		if (method === 'login' && name !== undefined) {
			const { email, password } = await promptLogin();
			const login = await loginSession(url, email, password);

			// A login here is the profile's new credential: it already has a config entry to belong to.
			credentialStorage(url, name).set(login.session);
			identity = login.identity;
		} else {
			const token = await promptToken(name ?? url);
			identity = await testConnection({ url, token, kind: 'token' });

			if (name !== undefined && (await ask(confirm({ message: 'Save this token for next time?' })))) {
				saveCredential(url, name, token);
				ctx.ui.success(savedTokenMessage(name));
			}
		}
	}

	ctx.ui.success(`Authenticated to ${url} as ${identity.user} (${identity.role}).`);

	ctx.ui.data({
		kind: 'ProfileTestReport',
		formatVersion: 1,
		ok: true,
		url,
		user: identity.user,
		role: identity.role,
		project: identity.projectName,
	});
}
