import { z } from 'zod';
import type { CommandContext, CommandDefinition } from '../../kernel/command.js';
import { loadConfig } from '../../kernel/config/file.js';

const schema = z.object({});

export const list: CommandDefinition = {
	name: 'list',
	description: 'List configured profiles',
	args: schema,
	run({ ctx }: CommandContext<z.infer<typeof schema>>) {
		const profiles = loadConfig({ cwd: ctx.cwd })?.config.profiles ?? {};
		const rows = Object.entries(profiles).map(([name, p]) => ({ name, url: p.url }));

		if (ctx.ui.json) {
			ctx.ui.data(rows);
			return;
		}

		if (rows.length === 0) {
			ctx.ui.info('No profiles configured.');
			return;
		}

		for (const row of rows) {
			ctx.ui.print(`${row.name}\t${row.url}`);
		}
	},
};
