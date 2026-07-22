import { type Command, Option } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { MODES } from '../../sync/mode.js';
import { SELECTABLE_RESOURCES } from '../../sync/resources.js';
import { diff, type DiffOptions } from './diff.js';
import { pull, type PullOptions } from './pull.js';
import { push, type PushOptions } from './push.js';
import { wizard } from './wizard.js';

function parseList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

export function registerSync(program: Command, getContext: () => CliContext): void {
	const sync = program.command('sync').description('Sync schema and configuration between Directus instances');

	// Commander runs this action only when no sync subcommand is given.
	sync.action(() => wizard(getContext()));

	sync
		.command('pull')
		.description('Snapshot schema and config resources from a source instance into committable files')
		.requiredOption('--from <profile>', 'Source profile name')
		.option('--collections <list>', 'Only these collections (comma-separated); pulls a partial snapshot', parseList)
		.option(
			'--exclude-collections <list>',
			'All collections except these (comma-separated); pulls a partial snapshot',
			parseList,
		)
		.option(
			'--resources <list>',
			`Only these config resources (comma-separated). Resources: ${SELECTABLE_RESOURCES.join(', ')}`,
			parseList,
		)
		.option('--exclude-resources <list>', 'All config resources except these (comma-separated)', parseList)
		.option('--content <list>', 'Also export records for these user collections (comma-separated)', parseList)
		.option('--no-deps', 'Do not pull resource dependencies (dependent children still ride with their parent)')
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: PullOptions) => pull(options, getContext()));

	sync
		.command('diff')
		.description('Show what a push would change on the target. Changes nothing')
		.requiredOption('--to <profile>', 'Target profile name')
		.addOption(
			new Option('--mode <mode>', 'add (only new records), merge (additive), or mirror (includes deletions)').choices(
				MODES,
			),
		)
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: DiffOptions) => diff(options, getContext()));

	sync
		.command('push')
		.description('Apply committed schema and data to a target instance')
		.requiredOption('--to <profile>', 'Target profile name')
		.addOption(
			new Option('--mode <mode>', 'add (only new records), merge (additive), or mirror (includes deletions)').choices(
				MODES,
			),
		)
		.option('--allow-deletes', 'Include deletions; without it deletions are refused outside interactive confirmation')
		.option('--yes', 'Skip the apply confirmation; never authorizes deletions')
		.option('--project <name>', 'Project scope to sync (default: default)', 'default')
		.action((options: PushOptions) => push(options, getContext()));
}
