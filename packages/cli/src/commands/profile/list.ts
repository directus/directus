import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';

export function registerList(command: Command, getContext: () => CliContext): void {
	command
		.command('list')
		.description('List configured profiles')
		.action(() => list(getContext()));
}

function list(ctx: CliContext): void {
	const profiles = ctx.config.load()?.config.profiles ?? {};
	const rows = Object.entries(profiles).map(([name, p]) => ({ name, url: p.url }));

	ctx.ui.data({ kind: 'ProfileListReport', formatVersion: 1, ok: true, profiles: rows });

	if (rows.length === 0) {
		ctx.ui.info('No profiles configured.');
		return;
	}

	for (const row of rows) {
		ctx.ui.print(`${row.name}\t${row.url}`);
	}
}
