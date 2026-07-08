import { version } from '../version.js';
import { renderCommandHelp, renderRootHelp } from './args/help.js';
import { parseCommandArgs } from './args/parse.js';
import type { CliContext, CommandGroup } from './command.js';
import { CliError, isCliError } from './error.js';
import { createUi } from './ui.js';

export interface RunOptions {
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

function didYouMean(paths: readonly string[], attempt: string): string | undefined {
	return paths.find((path) => path.startsWith(attempt));
}

// Normalize anything crossing the boundary into a real CliError — a command can
// throw a non-CliError, and the boundary must render it just as safely.
function toCliError(value: unknown): CliError {
	return isCliError(value) ? value : new CliError('UNKNOWN', value instanceof Error ? value.message : String(value));
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
		const near = didYouMean(commandPaths(groups), attempt);

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

		const parsed = parseCommandArgs(command.args, rest.slice(2));
		const ctx: CliContext = { cwd: options.cwd ?? process.cwd(), json: globals.json, ui };

		await command.run({ args: parsed.values, positionals: parsed.positionals, ctx });

		return 0;
	} catch (thrown) {
		return fail(toCliError(thrown));
	}
}
