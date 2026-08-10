import { confirm, select } from '@clack/prompts';
import type { Command } from 'commander';
import {
	credentialStorage,
	envTokenVar,
	resolveCredential,
	saveCredential,
	savedTokenMessage,
} from '../../kernel/config/credentials.js';
import { INVALID_URL_MESSAGE, isSafeUrl } from '../../kernel/config/file.js';
import { type Identity, loginSession, refreshSessionIfNeeded, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import { ask, orPrompt, promptAndRegisterToken, promptLogin } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';

interface TestConnectionOptions {
	readonly url?: string;
	readonly token?: string;
}

export function registerTestConnection(command: Command, getContext: () => CliContext): void {
	command
		.command('test-connection')
		.description('Verify a profile can authenticate. Name a profile or pass --url — one is required, never both')
		.argument('[name]', 'Profile name; prompted when omitted and no --url is given')
		.option('--url <url>', 'Test a URL directly, without a profile or configuration file')
		.option('--token <token>', 'Override the resolved token')
		.action((name: string | undefined, options: TestConnectionOptions) =>
			testProfileConnection(name, options, getContext()),
		);
}

export async function testProfileConnection(
	nameArg: string | undefined,
	options: TestConnectionOptions,
	ctx: CliContext,
): Promise<void> {
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
			'Name the profile: d6s profile test-connection <name>',
			{ message: 'Profile name', placeholder: 'production' },
			'Or test without one: d6s profile test-connection --url <url> --token <token>',
		);

		url = ctx.config.requireProfile(name).url;
	}

	const credential = resolveCredential(
		name !== undefined
			? { target: 'profile', url, profileName: name, tokenFlag: options.token }
			: { target: 'url', url, tokenFlag: options.token },
	);

	// Without a credential the only way forward is to ask for one, so a terminal is a precondition here.
	if (credential === undefined && !ctx.interactive) {
		throw new CliError('AUTH', `No token found for ${name !== undefined ? `"${name}"` : url}.`, {
			hint: name !== undefined ? `Set ${envTokenVar(name)} or pass --token.` : 'Pass --token to test a URL directly.',
		});
	}

	let identity: Identity;

	if (credential !== undefined) {
		await refreshSessionIfNeeded(credential);
		identity = await testConnection(credential);
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

			// A login here is the profile's new credential: it already has a configuration entry to belong to.
			credentialStorage(url, name).set(login.session);
			identity = login.identity;
		} else {
			const token = await promptAndRegisterToken(name ?? url);
			identity = await testConnection({ url, token, kind: 'token' });

			if (name !== undefined && (await ask(confirm({ message: 'Save this token for next time?' })))) {
				saveCredential(url, name, token);
				ctx.ui.success(savedTokenMessage(name));
			}
		}
	}

	ctx.ui.success(`Authenticated to ${url} as ${identity.user} (${identity.role}).`);

	ctx.ui.data({
		kind: 'ProfileTestConnectionReport',
		ok: true,
		url,
		user: identity.user,
		role: identity.role,
		instanceName: identity.projectName,
	});
}
