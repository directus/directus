import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { registerAdd } from './add.js';
import { registerList } from './list.js';
import { registerRemove } from './remove.js';
import { registerTest } from './test.js';
import { registerUpdate } from './update.js';

export function registerProfile(program: Command, getContext: () => CliContext): void {
	const command = program.command('profile').description('Manage connection profiles');

	registerAdd(command, getContext);
	registerUpdate(command, getContext);
	registerList(command, getContext);
	registerTest(command, getContext);
	registerRemove(command, getContext);
}
