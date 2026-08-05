import type { Command } from 'commander';
import type { CliContext } from '../../kernel/run.js';
import { registerDiff } from './diff.js';
import { registerPull } from './pull.js';
import { registerPush } from './push.js';
import { registerWizard } from './wizard.js';

export function registerSync(program: Command, getContext: () => CliContext): void {
	const sync = program.command('sync').description('Sync schema and configuration between Directus instances');

	registerWizard(sync, getContext);
	registerPull(sync, getContext);
	registerDiff(sync, getContext);
	registerPush(sync, getContext);
}
