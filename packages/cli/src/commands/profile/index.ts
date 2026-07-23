import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { registerAdd } from './add.js';
import { registerList } from './list.js';
import { registerRemove } from './remove.js';
import { registerTest } from './test.js';

export function registerProfile(program: Command, getContext: () => CliContext): void {
	const profile = program.command('profile').description('Manage connection profiles');

	registerAdd(profile, getContext);
	registerList(profile, getContext);
	registerTest(profile, getContext);
	registerRemove(profile, getContext);
}
