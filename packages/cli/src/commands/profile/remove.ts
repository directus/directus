import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { clearCredential } from '../../kernel/config/credentials.js';
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

		const url = removeProfile({ cwd: ctx.cwd, configPath: ctx.configPath }, name);
		ctx.ui.success(`Removed profile "${name}".`);

		// Config is the authority — its removal already succeeded. Clearing the saved
		// credential is best-effort cleanup, so a corrupt/unreadable store degrades to
		// a warning instead of failing a remove that otherwise worked.
		if (url !== undefined) {
			try {
				clearCredential(url, name);
			} catch {
				ctx.ui.warn('Removed the profile, but could not clear its saved credential.');
			}
		}

		ctx.ui.data({ removed: name });
	},
};
