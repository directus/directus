import { dirname } from 'node:path';
import { version } from '../version.js';
import { renderCommandHelp, renderRootHelp } from './args/help.js';
import { parseCommandArgs } from './args/parse.js';
import type { CliContext, CommandGroup } from './command.js';
import { findConfigPath } from './config/file.js';
import { loadProjectEnv } from './env.js';
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
}

const GLOBAL_FLAGS = new Set(['--help', '-h', '--version', '-v', '--json', '--no-color']);

function extractGlobals(argv: readonly string[]): { globals: Globals; rest: string[] } {
	const globals: Globals = { help: false, json: false, printVersion: false, noColor: false };
	const rest: string[] = [];
	let passthrough = false;

	for (const token of argv) {
		// Everything at/after a `--` terminator is literal — hand it to the
		// command untouched instead of extracting globals from it.
		if (passthrough || token === '--') {
			if (token === '--') passthrough = true;
			rest.push(token);
			continue;
		}

		if (!GLOBAL_FLAGS.has(token)) {
			rest.push(token);
			continue;
		}

		if (token === '--help' || token === '-h') globals.help = true;
		else if (token === '--version' || token === '-v') globals.printVersion = true;
		else if (token === '--json') globals.json = true;
		else if (token === '--no-color') globals.noColor = true;
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

	const groups = options.commands;
	const groupName = rest[0];
	const commandName = rest[1];

	if (groupName === undefined || (globals.help && commandName === undefined)) {
		ui.print(renderRootHelp(groups));
		return 0;
	}

	const command =
		commandName === undefined ? undefined : groups.find((g) => g.name === groupName)?.commands[commandName];

	if (command === undefined) {
		const attempt = commandName === undefined ? groupName : `${groupName} ${commandName}`;
		const near = commandPaths(groups).find((path) => path.startsWith(attempt));

		return fail(
			new CliError('UNKNOWN_COMMAND', `Unknown command: "${attempt}"`, {
				hint: near !== undefined ? `Did you mean "${near}"?` : "Run 'd6s --help' to list commands.",
			}),
		);
	}

	// Everything from here — arg parsing and the command body — runs inside the
	// single catch so a thrown CliError (or any thrown value) renders as an error
	// instead of escaping as an unhandled rejection.
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
		const configPath = findConfigPath(cwd);
		loadProjectEnv(configPath !== undefined ? dirname(configPath) : cwd);

		const parsed = parseCommandArgs(command.args, rest.slice(2));
		const ctx: CliContext = { cwd, ui };

		await command.run({ args: parsed.values, positionals: parsed.positionals, ctx });

		return 0;
	} catch (thrown) {
		// A command may throw a non-CliError; the boundary renders it just as safely.
		const error = isCliError(thrown)
			? thrown
			: new CliError('UNKNOWN', thrown instanceof Error ? thrown.message : String(thrown));

		return fail(error);
	}
}
