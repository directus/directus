import { confirm } from '@clack/prompts';
import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { testConnection } from '../../kernel/config/connection.js';
import { resolveCredential, type ResolvedCredential } from '../../kernel/config/credentials.js';
import { loadConfig } from '../../kernel/config/file.js';
import { resolveProfile } from '../../kernel/config/profiles.js';
import { CliError } from '../../kernel/error.js';
import { ask, promptToken, saveToken } from '../../kernel/prompt.js';

const schema = z.object({ token: z.string().optional().describe('Override the resolved token') });

export const test: CommandDefinition = {
	name: 'test',
	description: 'Verify a profile can authenticate',
	args: schema,
	async run({ args, positionals, ctx }: CommandContext<z.infer<typeof schema>>) {
		const name = positionals[0];
		if (name === undefined) throw new CliError('USAGE', 'Name the profile: d6s profile test <name>');

		const loaded = loadConfig({ cwd: ctx.cwd });
		if (loaded === undefined) throw new CliError('CONFIG', 'No directus.config.json found.');

		const profile = resolveProfile(loaded.config, name);

		const resolution = resolveCredential({
			url: profile.url,
			profileName: name,
			hasConfiguredProfiles: Object.keys(loaded.config.profiles).length > 0,
			...(args.token !== undefined ? { tokenFlag: args.token } : {}),
		});

		let credential: ResolvedCredential;

		if (resolution.found) {
			credential = resolution.credential;
		} else if (ctx.interactive) {
			const token = await promptToken(name);
			credential = { url: profile.url, token, source: 'prompt' };
		} else {
			throw new CliError('AUTH', `No token found for "${name}".`, {
				hint: `Set ${resolution.envVar} or pass --token.`,
			});
		}

		const identity = await testConnection(credential);
		ctx.ui.success(`Authenticated to ${profile.url} as ${identity.user} (${identity.role}).`);

		// A freshly-prompted token is worth persisting only now that it's proven to work.
		if (credential.source === 'prompt' && (await ask(confirm({ message: 'Save this token for next time?' })))) {
			saveToken(ctx.ui, profile.url, name, credential.token);
		}

		ctx.ui.data({
			ok: true,
			url: profile.url,
			user: identity.user,
			role: identity.role,
			project: identity.projectName,
		});
	},
};
