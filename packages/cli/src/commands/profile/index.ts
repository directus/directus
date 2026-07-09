import type { CommandGroup } from '../../kernel/command.js';
import { add } from './add.js';
import { list } from './list.js';
import { remove } from './remove.js';
import { test } from './test.js';

export const profile: CommandGroup = {
	name: 'profile',
	description: 'Manage connection profiles',
	commands: { add, list, test, remove },
};
