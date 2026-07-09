import { confirm } from '@clack/prompts';
import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { upsertProfile } from '../../kernel/config/file.js';
import { ask, orPrompt, promptToken, saveToken } from '../../kernel/prompt.js';

const schema = z.object({
	url: z.url().optional().describe('Directus instance URL'),
	token: z.string().optional().describe('Static token to save for this profile'),
});

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
				validate: (v) => (v?.trim() ? undefined : 'Required.'),
			},
		);

		const url = await orPrompt(args.url, ctx.interactive, 'Provide the instance URL: --url <url>', {
			message: 'Directus URL',
			placeholder: 'https://',
			validate: (v) => (v && z.url().safeParse(v).success ? undefined : 'Enter a valid URL.'),
		});

		upsertProfile(ctx.cwd, name, { url, auth: { type: 'token' } });
		ctx.ui.success(`Saved profile "${name}" → ${url}`);

		let token = args.token;

		if (
			token === undefined &&
			ctx.interactive &&
			(await ask(confirm({ message: 'Add a token for this profile now?' })))
		) {
			token = await promptToken(name);
		}

		if (token !== undefined) {
			saveToken(ctx.ui, url, name, token);
		}

		ctx.ui.data({ name, url, tokenSaved: token !== undefined });
	},
};
