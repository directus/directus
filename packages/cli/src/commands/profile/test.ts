import { confirm, select } from '@clack/prompts';
import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { resolveCredential } from '../../kernel/config/credentials.js';
import { isSafeUrl, loadConfig, resolveProfile } from '../../kernel/config/file.js';
import { type Identity, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import { ask, promptLogin, promptToken, saveToken } from '../../kernel/prompt.js';

const schema = z.object({
	// Same guard as `profile add`: a credential/query-bearing URL must not be usable
	// here either, or `profile test` could print one to output.
	url: z
		.url()
		.refine(isSafeUrl, 'Use an http(s) URL with no credentials, query, or fragment.')
		.optional()
		.describe('Test a URL directly, without a profile or config file'),
	token: z.string().optional().describe('Override the resolved token'),
});

export const test: CommandDefinition = {
	name: 'test',
	description: 'Verify a profile can authenticate',
	args: schema,
	async run({ args, positionals, ctx }: CommandContext<z.infer<typeof schema>>) {
		const name = positionals[0];

		if (name !== undefined && args.url !== undefined) {
			throw new CliError('USAGE', 'Pass a profile name or --url, not both.');
		}

		let url: string;

		if (args.url !== undefined) {
			// Profile-less: the config is never consulted, --url alone names the target.
			url = args.url;
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
			// A resolved profile proves config profiles exist, which disables the bare
			// DIRECTUS_TOKEN fallback (misbinding guard F12).
			hasConfiguredProfiles: name !== undefined,
			// An explicit --url must supply its own credential (--token or a prompt): the
			// ambient DIRECTUS_TOKEN is never sent to a target the user typed by hand, so
			// a typo can't leak it to an arbitrary host.
			...(args.url !== undefined ? { explicitUrl: true } : {}),
			...(name !== undefined ? { profileName: name } : {}),
			...(args.token !== undefined ? { tokenFlag: args.token } : {}),
		});

		let identity: Identity;

		if (resolution.found) {
			identity = await testConnection(resolution.credential);
		} else if (!ctx.interactive) {
			throw new CliError('AUTH', `No token found for ${name !== undefined ? `"${name}"` : url}.`, {
				// A named profile can resolve DIRECTUS_<NAME>_TOKEN; an explicit --url only
				// accepts an explicit token, so don't point it at an env var it won't read.
				hint: name !== undefined ? `Set ${resolution.envVar} or pass --token.` : 'Pass --token to test a URL directly.',
			});
		} else {
			// A session needs a profile to key its store entry, so login is only offered
			// with a name; profile-less --url stays paste-only.
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
				// Login persists a session and authenticates in one step — nothing to save.
				identity = await promptLogin(url, name);
			} else {
				const token = await promptToken(name ?? url);
				identity = await testConnection({ url, token, source: 'prompt' });

				// Persist the freshly-prompted token only now that it's proven to work —
				// and only under a profile name, which is how the store is keyed.
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
	},
};
