import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { registerDiff } from './diff.js';
import { registerPull } from './pull.js';
import { registerPush } from './push.js';
import { registerWizard } from './wizard.js';

export function registerSync(program: Command, getContext: () => CliContext): void {
	const command = program.command('sync').description('Sync schema and configuration between Directus instances');

	registerWizard(command, getContext);
	registerPull(command, getContext);
	registerDiff(command, getContext);
	registerPush(command, getContext);
}
