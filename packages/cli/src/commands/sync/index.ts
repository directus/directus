import { type Command, Option } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { diff, type DiffOptions } from './diff.js';
import { pull, type PullOptions } from './pull.js';
import { push, type PushOptions } from './push.js';

export function registerSync(program: Command, getContext: () => CliContext): void {
	const sync = program.command('sync').description('Sync schema and configuration between Directus instances');

	sync
		.command('pull')
		.description('Snapshot schema from a source instance into committable files')
		.requiredOption('--from <profile>', 'Source profile name')
		.option('--collections <list>', 'Only these collections (comma-separated); pulls a partial snapshot')
		.option('--exclude-collections <list>', 'All collections except these (comma-separated); pulls a partial snapshot')
		.action((options: PullOptions) => pull(options, getContext()));

	sync
		.command('diff')
		.description('Show what a push would change on the target. Changes nothing')
		.requiredOption('--to <profile>', 'Target profile name')
		// merge is the CLI default even though the server defaults to mirror: additive is the path of
		// least surprise, so a caller opts into deletions rather than getting them by omission.
		.addOption(
			new Option('--mode <mode>', 'merge (additive) or mirror (includes deletions)')
				.choices(['merge', 'mirror'])
				.default('merge'),
		)
		.action((options: DiffOptions) => diff(options, getContext()));

	sync
		.command('push')
		.description('Apply committed schema files to a target instance')
		.requiredOption('--to <profile>', 'Target profile name')
		// merge is the CLI default even though the server defaults to mirror: additive is the path of
		// least surprise, so a caller opts into deletions rather than getting them by omission.
		.addOption(
			new Option('--mode <mode>', 'merge (additive) or mirror (includes deletions)')
				.choices(['merge', 'mirror'])
				.default('merge'),
		)
		.option('--allow-deletes', 'Include deletions; without it deletions are refused outside interactive confirmation')
		.option('--yes', 'Skip the apply confirmation; never authorizes deletions')
		.action((options: PushOptions) => push(options, getContext()));
}
