import { dirname, resolve } from 'node:path';
import { version } from '../version.js';
import { renderCommandHelp, renderGroupHelp, renderRootHelp } from './args/help.js';
import { parseCommandArgs } from './args/parse.js';
import type { CliContext, CommandGroup } from './command.js';
import { findConfigPath } from './config/file.js';
import { isCI, loadProjectEnv } from './env.js';
import { CliError, isCliError } from './error.js';
import { createUi } from './ui.js';

interface RunOptions {
	readonly commands: readonly CommandGroup[];
	readonly cwd?: string;
}

interface Globals {
	help: boolean;
	json: boolean;
	printVersion: boolean;
	noColor: boolean;
	noInteractive: boolean;
	configPath: string | undefined;
	configMissingValue: boolean;
}

type BooleanGlobal = 'help' | 'json' | 'printVersion' | 'noColor' | 'noInteractive';

// Each boolean global flag (and its aliases) maps to the key it sets. --config
// is handled separately below because it takes a value.
const GLOBAL_FLAGS: Record<string, BooleanGlobal> = {
	'--help': 'help',
	'-h': 'help',
	'--version': 'printVersion',
	'-v': 'printVersion',
	'--json': 'json',
	'--no-color': 'noColor',
	'--no-interactive': 'noInteractive',
};

function extractGlobals(argv: readonly string[]): { globals: Globals; rest: string[] } {
	const globals: Globals = {
		help: false,
		json: false,
		printVersion: false,
		noColor: false,
		noInteractive: false,
		configPath: undefined,
		configMissingValue: false,
	};

	const rest: string[] = [];
	let passthrough = false;

	for (let i = 0; i < argv.length; i++) {
		const token = argv[i]!;

		// Everything at/after a `--` terminator is literal — hand it to the
		// command untouched instead of extracting globals from it.
		if (passthrough || token === '--') {
			if (token === '--') passthrough = true;
			rest.push(token);
			continue;
		}

		// --config is the one value-taking global; consume its value here so it
		// never reaches the command's own parser. In the space form, a flag-looking
		// next token is a missing value — don't swallow it (e.g. `--config --json`
		// must not become a path named "--json"). Use `--config=<path>` to be explicit.
		if (token === '--config') {
			const next = argv[i + 1];
			if (next === undefined || next === '' || next.startsWith('-')) globals.configMissingValue = true;
			else globals.configPath = argv[++i];
			continue;
		}

		if (token.startsWith('--config=')) {
			const value = token.slice('--config='.length);
			if (value === '') globals.configMissingValue = true;
			else globals.configPath = value;
			continue;
		}

		const flag = GLOBAL_FLAGS[token];
		if (flag === undefined) rest.push(token);
		else globals[flag] = true;
	}

	return { globals, rest };
}

function commandPaths(groups: readonly CommandGroup[]): string[] {
	const paths: string[] = [];

	for (const group of groups) {
		for (const name of Object.keys(group.commands)) {
			paths.push(`${group.name} ${name}`);
		}
	}

	return paths;
}

// The single throw/exit boundary: internals throw CliError; here we render via ui
// and map to an exit code. Returns the code; bin.ts sets process.exitCode.
export async function run(argv: readonly string[], options: RunOptions): Promise<number> {
	const { globals, rest } = extractGlobals(argv);

	const ui = createUi({ json: globals.json, color: !globals.noColor });

	// --version is terminal regardless of position (e.g. `d6s sync --version`).
	if (globals.printVersion) {
		ui.print(version);
		return 0;
	}

	const fail = (error: CliError): number => {
		ui.error(error);
		// Guard the process boundary: process.exitCode throws RangeError on a
		// non-integer / out-of-range value, and an error must never exit 0.
		const code = error.exitCode;
		return Number.isInteger(code) && code >= 1 && code <= 255 ? code : 1;
	};

	if (globals.configMissingValue) {
		return fail(new CliError('USAGE', 'Missing value for --config.', { hint: 'Pass a path: --config <path>' }));
	}

	const groups = options.commands;
	const groupName = rest[0];
	const commandName = rest[1];

	if (groupName === undefined) {
		ui.print(renderRootHelp(groups));
		return 0;
	}

	// Suggest the nearest known command path by prefix, or fall back to the given
	// help hint when nothing is close.
	const unknownCommand = (attempt: string, paths: string[], fallbackHint: string): CliError => {
		const near = paths.find((path) => path.startsWith(attempt));
		return new CliError('UNKNOWN_COMMAND', `Unknown command: "${attempt}"`, {
			hint: near !== undefined ? `Did you mean "${near}"?` : fallbackHint,
		});
	};

	const group = groups.find((g) => g.name === groupName);

	if (group === undefined) {
		const attempt = commandName === undefined ? groupName : `${groupName} ${commandName}`;
		return fail(unknownCommand(attempt, commandPaths(groups), "Run 'd6s --help' to list commands."));
	}

	// `d6s <group>` or `d6s <group> --help`: the group is real but no action was
	// named — show its subcommands rather than error on an incomplete command.
	if (commandName === undefined) {
		ui.print(renderGroupHelp(group));
		return 0;
	}

	const command = group.commands[commandName];

	if (command === undefined) {
		return fail(
			unknownCommand(
				`${groupName} ${commandName}`,
				commandPaths([group]),
				`Run 'd6s ${groupName} --help' to list ${groupName} commands.`,
			),
		);
	}

	try {
		if (globals.help) {
			ui.print(renderCommandHelp(groupName, command));
			return 0;
		}

		// Load a project `.env` before the command resolves anything, so env-based
		// credentials (DIRECTUS_<PROFILE>_TOKEN) are visible. Read it from the config's
		// directory — the project root — so it resolves the same from any subdirectory
		// as the walk-up config discovery does; fall back to cwd when there's no config.
		const cwd = options.cwd ?? process.cwd();
		const explicitConfig = globals.configPath !== undefined ? resolve(cwd, globals.configPath) : undefined;
		const configPath = explicitConfig ?? findConfigPath(cwd);
		loadProjectEnv(configPath !== undefined ? dirname(configPath) : cwd);

		// Prompts are for humans only: a real TTY on both ends, never CI, never the
		// machine-readable --json path, and overridable with --no-interactive.
		const interactive =
			Boolean(process.stdout.isTTY) &&
			Boolean(process.stdin.isTTY) &&
			!isCI() &&
			!globals.json &&
			!globals.noInteractive;

		const parsed = parseCommandArgs(command.args, rest.slice(2));
		const ctx: CliContext = { cwd, configPath: explicitConfig, ui, interactive };

		await command.run({ args: parsed.values, positionals: parsed.positionals, ctx });

		return 0;
	} catch (thrown) {
		const error = isCliError(thrown)
			? thrown
			: new CliError('UNKNOWN', thrown instanceof Error ? thrown.message : String(thrown));

		return fail(error);
	}
}
