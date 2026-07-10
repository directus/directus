import { confirm, select } from '@clack/prompts';
import { resolveCredential } from '../../kernel/config/credentials.js';
import { isSafeUrl, loadConfig, resolveProfile } from '../../kernel/config/file.js';
import { type Identity, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import { ask, promptLogin, promptToken, saveToken } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';

export interface TestOptions {
	readonly url?: string;
	readonly token?: string;
}

export async function testProfile(name: string | undefined, options: TestOptions, ctx: CliContext): Promise<void> {
	if (name !== undefined && options.url !== undefined) {
		throw new CliError('USAGE', 'Pass a profile name or --url, not both.');
	}

	let url: string;

	if (options.url !== undefined) {
		if (!isSafeUrl(options.url)) throw new CliError('USAGE', 'Enter a valid http(s) URL.');
		url = options.url;
	} else {
		if (name === undefined) {
			throw new CliError('USAGE', 'Name the profile: d6s profile test <name>', {
				hint: 'Or test without one: d6s profile test --url <url> --token <token>',
			});
		}

		const loaded = loadConfig({ cwd: ctx.cwd, configPath: ctx.configPath });
		if (loaded === undefined) throw new CliError('CONFIG', 'No directus.config.json found.');

		url = resolveProfile(loaded.config, name).url;
	}

	const resolution = resolveCredential({
		url,
		hasConfiguredProfiles: name !== undefined,
		...(options.url !== undefined ? { explicitUrl: true } : {}),
		...(name !== undefined ? { profileName: name } : {}),
		...(options.token !== undefined ? { tokenFlag: options.token } : {}),
	});

	let identity: Identity;

	if (resolution.found) {
		identity = await testConnection(resolution.credential);
	} else if (!ctx.interactive) {
		throw new CliError('AUTH', `No token found for ${name !== undefined ? `"${name}"` : url}.`, {
			hint: name !== undefined ? `Set ${resolution.envVar} or pass --token.` : 'Pass --token to test a URL directly.',
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
			identity = await promptLogin(url, name);
		} else {
			const token = await promptToken(name ?? url);
			identity = await testConnection({ url, token, source: 'prompt' });

			if (name !== undefined && (await ask(confirm({ message: 'Save this token for next time?' })))) {
				saveToken(ctx.ui, url, name, token);
			}
		}
	}

	ctx.ui.success(`Authenticated to ${url} as ${identity.user} (${identity.role}).`);

	ctx.ui.data({
		ok: true,
		url,
		user: identity.user,
		role: identity.role,
		project: identity.projectName,
	});
}
