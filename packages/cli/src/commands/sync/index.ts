import { type Command, Option } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { diff, type DiffOptions } from './diff.js';
import { pull, type PullOptions } from './pull.js';
import { push, type PushOptions } from './push.js';

export function registerSync(program: Command, getContext: () => CliContext): void {
	const sync = program.command('sync').description('Sync schema and configuration between Directus instances');

	sync
		.command('pull')
		.description("Snapshot a source instance's schema into committable files")
		.requiredOption('--from <profile>', 'Source profile name')
		.action((options: PullOptions) => pull(options, getContext()));

	sync
		.command('diff')
		.description('Compare the local schema snapshot against a target instance')
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
		.description('Apply the local schema snapshot to a target instance')
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
