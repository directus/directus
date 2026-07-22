import { type Command, Option } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { SELECTABLE_RESOURCES } from '../../sync/resources.js';
import { diff, type DiffOptions } from './diff.js';
import { pull, type PullOptions } from './pull.js';
import { push, type PushOptions } from './push.js';

export function registerSync(program: Command, getContext: () => CliContext): void {
	const sync = program.command('sync').description('Sync schema and configuration between Directus instances');

	sync
		.command('pull')
		.description('Snapshot schema and config resources from a source instance into committable files')
		.requiredOption('--from <profile>', 'Source profile name')
		.option('--collections <list>', 'Only these collections (comma-separated); pulls a partial snapshot')
		.option('--exclude-collections <list>', 'All collections except these (comma-separated); pulls a partial snapshot')
		// Built from the exported constant so the resource list in help can never drift from the graph.
		.option(
			'--resources <list>',
			`Only these config resources (comma-separated). Resources: ${SELECTABLE_RESOURCES.join(', ')}`,
		)
		.option('--exclude-resources <list>', 'All config resources except these (comma-separated)')
		.option('--content <list>', 'Also export records for these user collections (comma-separated)')
		.option('--no-deps', 'Do not pull resource dependencies (dependent children still ride with their parent)')
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
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
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: DiffOptions) => diff(options, getContext()));

	sync
		.command('push')
		.description('Apply committed schema and data to a target instance')
		// No commander default on --mode: an absent flag lets push resolve flag > project config mode >
		// merge, so a per-project `mode` in directus.config.json is honored instead of being masked by a
		// default. merge is additive and the fallback — a caller opts into deletions rather than defaulting.
		.requiredOption('--to <profile>', 'Target profile name')
		.addOption(
			new Option('--mode <mode>', 'add (only new records), merge (additive), or mirror (includes deletions)').choices([
				'add',
				'merge',
				'mirror',
			]),
		)
		.option('--allow-deletes', 'Include deletions; without it deletions are refused outside interactive confirmation')
		.option('--yes', 'Skip the apply confirmation; never authorizes deletions')
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: PushOptions) => push(options, getContext()));
}
