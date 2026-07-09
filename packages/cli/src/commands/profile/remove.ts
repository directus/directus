import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { removeProfile } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';

const schema = z.object({});

export const remove: CommandDefinition = {
	name: 'remove',
	description: 'Remove a profile',
	args: schema,
	run({ positionals, ctx }: CommandContext<z.infer<typeof schema>>) {
		const name = positionals[0];
		if (name === undefined) throw new CliError('USAGE', 'Name the profile: d6s profile remove <name>');

		removeProfile(ctx.cwd, name);
		ctx.ui.success(`Removed profile "${name}".`);
		ctx.ui.data({ removed: name });
	},
};
