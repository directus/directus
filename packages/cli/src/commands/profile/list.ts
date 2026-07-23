import type { Command } from 'commander';
import { loadConfig } from '../../kernel/config/file.js';
import type { CliContext } from '../../kernel/run.js';

export function registerList(profile: Command, getContext: () => CliContext): void {
	profile
		.command('list')
		.description('List configured profiles')
		.action(() => list(getContext()));
}

export function list(ctx: CliContext): void {
	const profiles = loadConfig({ cwd: ctx.cwd, configPath: ctx.configPath })?.config.profiles ?? {};
	const rows = Object.entries(profiles).map(([name, p]) => ({ name, url: p.url }));

	ctx.ui.data(rows);

	if (rows.length === 0) {
		ctx.ui.info('No profiles configured.');
		return;
	}

	for (const row of rows) {
		ctx.ui.print(`${row.name}\t${row.url}`);
	}
}
