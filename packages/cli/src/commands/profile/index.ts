import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { add, type AddOptions } from './add.js';
import { list } from './list.js';
import { remove } from './remove.js';
import { type TestOptions, testProfile } from './test.js';

export function registerProfile(program: Command, getContext: () => CliContext): void {
	const profile = program.command('profile').description('Manage connection profiles');

	profile
		.command('add')
		.description('Add or update a profile (upsert)')
		.argument('[name]')
		.option('--url <url>', 'Directus instance URL')
		.option('--token <token>', 'Static token to save for this profile')
		.action((name: string | undefined, options: AddOptions) => add(name, options, getContext()));

	profile
		.command('list')
		.description('List configured profiles')
		.action(() => list(getContext()));

	profile
		.command('test')
		.description('Verify a profile can authenticate')
		.argument('[name]')
		.option('--url <url>', 'Test a URL directly, without a profile or config file')
		.option('--token <token>', 'Override the resolved token')
		.action((name: string | undefined, options: TestOptions) => testProfile(name, options, getContext()));

	profile
		.command('remove')
		.description('Remove a profile')
		.argument('<name>')
		.action((name: string) => remove(name, getContext()));
}
