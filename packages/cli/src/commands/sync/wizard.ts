import { select } from '@clack/prompts';
import type { Command } from 'commander';
import { describeMode, MODES, type SyncMode } from '../../kernel/config/mode.js';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { pull } from './pull.js';
import { push } from './push.js';
import { byCodepoint } from './utils/codepoint.js';
import { DEFAULT_PROJECT } from './utils/resolve-target.js';

/** The wizard is what a bare `d6s sync` runs, so it registers as the parent's action rather than a subcommand. */
export function registerWizard(command: Command, getContext: () => CliContext): void {
	command.action(() => wizard(getContext()));
}

/** Prompt for sync direction and mode, then run the same commands used by explicit subcommands. */
export async function wizard(ctx: CliContext): Promise<void> {
	if (!ctx.interactive) {
		throw new CliError('USAGE', 'd6s sync needs a terminal.', {
			hint: 'Run the subcommands explicitly: d6s sync pull / diff / push.',
		});
	}

	const loaded = ctx.config.requireConfig();
	const profiles = Object.keys(loaded.config.profiles).sort(byCodepoint);

	if (profiles.length < 2) {
		throw new CliError('CONFIG', 'd6s sync needs at least two profiles: a source and a target.', {
			hint: 'Add another profile: d6s profile add <name> --url <url>',
		});
	}

	ctx.ui.info('Sync a source instance to a target through local project files.');

	const from = await ask(
		select({
			message: 'Source profile (pull from):',
			options: profiles.map((name) => ({ value: name, label: name })),
		}),
	);

	const to = await ask(
		select({
			message: 'Target profile (push to):',
			options: profiles.filter((name) => name !== from).map((name) => ({ value: name, label: name })),
		}),
	);

	const declared = Object.keys(loaded.config.projects)
		.filter((name) => name !== DEFAULT_PROJECT)
		.sort(byCodepoint);

	const projectChoices = [DEFAULT_PROJECT, ...declared];

	let project: string = DEFAULT_PROJECT;

	if (projectChoices.length > 1) {
		project = await ask(
			select({
				message: 'Project scope:',
				options: projectChoices.map((name) => ({ value: name, label: name })),
			}),
		);
	}

	const configuredMode = loaded.config.projects[project]?.mode;

	let promptedMode: SyncMode | undefined;

	if (configuredMode === undefined) {
		const modeOptions = MODES.map((mode) => ({ value: mode, label: describeMode(mode) }));

		promptedMode = await ask(select({ message: 'Push mode:', initialValue: 'merge', options: modeOptions }));
	}

	await pull({ from, project, deps: true }, ctx);
	await push({ to, project, ...(promptedMode !== undefined ? { mode: promptedMode } : {}) }, ctx);

	// Persist only after a successful push; aborted pushes must not change configuration.
	if (promptedMode !== undefined) {
		ctx.config.upsertProjectMode(project, promptedMode);
		ctx.ui.info(`Saved mode "${promptedMode}" for project "${project}" to directus.config.json.`);
	}
}
