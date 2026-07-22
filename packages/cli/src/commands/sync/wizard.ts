import { select } from '@clack/prompts';
import { loadConfig, upsertProjectMode } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { byCodepoint } from '../../sync/codepoint.js';
import type { Mode } from '../../sync/mode.js';
import { pull } from './pull.js';
import { push } from './push.js';

const MODE_LABELS: Record<Mode, string> = {
	merge: 'merge (additive)',
	add: 'add (only new records)',
	mirror: 'mirror (includes deletions)',
};

/**
 * Prompt for unresolved sync choices, then run the same pull and push commands used by explicit subcommands.
 */
export async function wizard(ctx: CliContext): Promise<void> {
	// Refuse non-interactive use rather than waiting forever on a prompt.
	if (!ctx.interactive) {
		throw new CliError('USAGE', 'd6s sync needs a terminal.', {
			hint: 'Run the subcommands explicitly: d6s sync pull / diff / push.',
		});
	}

	const loaded = loadConfig({ cwd: ctx.cwd, configPath: ctx.configPath });

	if (loaded === undefined) {
		throw new CliError('CONFIG', 'No directus.config.json found.', {
			hint: 'Create one first: d6s profile add <name> --url <url>',
		});
	}

	const profiles = Object.keys(loaded.config.profiles).sort(byCodepoint);

	if (profiles.length < 2) {
		throw new CliError('CONFIG', 'd6s sync needs at least two profiles: a source and a target.', {
			hint: 'Add another profile: d6s profile add <name> --url <url>',
		});
	}

	ctx.ui.info('Sync a source instance to a target through committed files.');

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
		.filter((name) => name !== 'default')
		.sort(byCodepoint);

	const projectChoices = ['default', ...declared];

	let project = 'default';

	if (projectChoices.length > 1) {
		project = await ask(
			select({
				message: 'Project scope:',
				options: projectChoices.map((name) => ({ value: name, label: name })),
			}),
		);
	}

	// Omit a configured mode so push remains the single owner of mode precedence.
	const configuredMode = loaded.config.projects[project]?.mode;

	let promptedMode: Mode | undefined;

	if (configuredMode === undefined) {
		const modeOptions: { value: Mode; label: string }[] = [
			{ value: 'merge', label: MODE_LABELS.merge },
			{ value: 'add', label: MODE_LABELS.add },
			{ value: 'mirror', label: MODE_LABELS.mirror },
		];

		promptedMode = await ask(select({ message: 'Mode:', initialValue: 'merge', options: modeOptions }));

		// Persist the answer so later pushes default to it (and later wizard runs stop asking); an explicit
		// --mode flag still overrides.
		upsertProjectMode(loaded.path, project, promptedMode);
		ctx.ui.info(`Saved mode "${promptedMode}" for project "${project}" to directus.config.json.`);
	}

	await pull({ from, project, deps: true }, ctx);
	await push({ to, project, ...(promptedMode !== undefined ? { mode: promptedMode } : {}) }, ctx);
}
