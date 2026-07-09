import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { saveCredential } from '../../kernel/config/credentials.js';
import { upsertProfile } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';

const schema = z.object({
	url: z.url().describe('Directus instance URL'),
	token: z.string().optional().describe('Static token to save for this profile'),
	protect: z.boolean().default(false).describe('Never a default target; sealed pushes in CI'),
});

export const add: CommandDefinition = {
	name: 'add',
	description: 'Add or update a profile (upsert)',
	args: schema,
	run({ args, positionals, ctx }: CommandContext<z.infer<typeof schema>>) {
		const name = positionals[0];
		if (name === undefined) throw new CliError('USAGE', 'Name the profile: d6s profile add <name> --url <url>');

		upsertProfile(ctx.cwd, name, { url: args.url, auth: { type: 'token' }, protect: args.protect });
		ctx.ui.success(`Saved profile "${name}" → ${args.url}`);

		if (args.token !== undefined) {
			saveCredential(args.url, name, args.token);
			ctx.ui.success(`Saved a token for "${name}" to the credential store.`);
		}

		ctx.ui.data({ name, url: args.url, protect: args.protect, tokenSaved: args.token !== undefined });
	},
};
