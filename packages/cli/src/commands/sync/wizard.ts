import { select } from '@clack/prompts';
import { loadConfig } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import { ask } from '../../kernel/prompt.js';
import type { CliContext } from '../../kernel/run.js';
import { pull } from './pull.js';
import { type Mode, push } from './push.js';

// Codepoint comparison, never localeCompare/Intl (see the store): the prompt option order must not vary
// by machine, so the wizard shows the same choices in the same order to every operator.
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

// One-line mode labels matching the --mode help text, so the wizard names each mode exactly as the flag does.
const MODE_LABELS: Record<Mode, string> = {
	merge: 'merge (additive)',
	add: 'add (only new records)',
	mirror: 'mirror (includes deletions)',
};

/**
 * Bare `d6s sync`: the team flow in one sitting (spec Q13). It gathers source/target/project/mode, then
 * runs THE PRIMITIVES — the exported pull() then push() — with the constructed options. The wizard owns
 * prompts and sequencing only; there is no second code path. Prompts fire ONLY where the config does not
 * already answer (one project → no project prompt; a committed mode → no mode prompt). CI and machine
 * callers use the explicit subcommands instead.
 */
export async function wizard(ctx: CliContext): Promise<void> {
	// The whole flow is interactive by definition — it exists to prompt. CI, --json, and --no-interactive
	// all clear ctx.interactive, and each must route to the subcommands rather than hang waiting on a prompt.
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

	// Source and target are two different profiles, so the wizard needs at least two. Authentication is not
	// checked here — that is pull's and push's job when they resolve each profile's credential.
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

	// The target list excludes the chosen source so the same profile can never be both ends of the sync.
	const to = await ask(
		select({
			message: 'Target profile (push to):',
			options: profiles.filter((name) => name !== from).map((name) => ({ value: name, label: name })),
		}),
	);

	// Projects: `default` plus every declared project. Prompt only when that leaves more than one choice —
	// otherwise the config has answered it, so pick `default` silently (spec Q13: prompt only where config
	// does not answer).
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

	// Mode: a project's committed `mode` answers it — leave it off the push options so push re-resolves to
	// the exact same value (flag > project config > merge). Otherwise prompt, merge first and initial, and
	// pass the choice through so push honors what the operator picked.
	const configuredMode = loaded.config.projects[project]?.mode;

	let promptedMode: Mode | undefined;

	if (configuredMode === undefined) {
		const modeOptions: { value: Mode; label: string }[] = [
			{ value: 'merge', label: MODE_LABELS.merge },
			{ value: 'add', label: MODE_LABELS.add },
			{ value: 'mirror', label: MODE_LABELS.mirror },
		];

		promptedMode = await ask(select({ message: 'Mode:', initialValue: 'merge', options: modeOptions }));
	}

	// The primitives, sequenced: a full-scope pull under the project's config scope (closure on), then a
	// push that renders the plan, dry-runs, confirms, gates, applies, and imports. pull and push own their
	// own output, so the wizard adds no summary of its own.
	await pull({ from, project, deps: true }, ctx);
	await push({ to, project, ...(promptedMode !== undefined ? { mode: promptedMode } : {}) }, ctx);
}
