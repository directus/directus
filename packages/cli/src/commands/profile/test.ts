import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { testConnection } from '../../kernel/config/connection.js';
import { resolveCredential } from '../../kernel/config/credentials.js';
import { loadConfig } from '../../kernel/config/file.js';
import { resolveProfile } from '../../kernel/config/profiles.js';
import { CliError } from '../../kernel/error.js';

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

		if (!resolution.found) {
			throw new CliError('AUTH', `No token found for "${name}".`, {
				hint: `Set ${resolution.envVar} or pass --token.`,
			});
		}

		const identity = await testConnection(resolution.credential);
		ctx.ui.success(`Authenticated to ${profile.url} as ${identity.user} (${identity.role}).`);

		ctx.ui.data({
			ok: true,
			url: profile.url,
			user: identity.user,
			role: identity.role,
			project: identity.projectName,
		});
	},
};
