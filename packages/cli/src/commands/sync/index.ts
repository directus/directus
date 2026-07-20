import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { pull, type PullOptions } from './pull.js';

export function registerSync(program: Command, getContext: () => CliContext): void {
	const sync = program.command('sync').description('Sync schema and configuration between Directus instances');

	sync
		.command('pull')
		.description("Snapshot a source instance's schema into committable files")
		.requiredOption('--from <profile>', 'Source profile name')
		.action((options: PullOptions) => pull(options, getContext()));
}
