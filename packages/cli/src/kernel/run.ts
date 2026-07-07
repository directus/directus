import { version } from '../version.js';
import { renderCommandHelp, renderRootHelp } from './args/help.js';
import { parseCommandArgs } from './args/parse.js';
import { createContext } from './context.js';
import type { PluginDefinition } from './plugins/define.js';
import { createRegistry } from './registry.js';
import { type CliError, cliError, isCliError } from './result.js';
import { createUi } from './ui.js';

export interface RunOptions {
	readonly plugins: readonly PluginDefinition[];
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

function didYouMean(paths: readonly string[], attempt: string): string | undefined {
	return paths.find((path) => path.startsWith(attempt));
}

// Normalize anything crossing the boundary — a thrown value or a returned
// Result error — into a real CliError. A plugin can leak a non-CliError through
// `any`, and both paths must be equally defensive.
function toCliError(value: unknown): CliError {
	return isCliError(value) ? value : cliError('UNKNOWN', value instanceof Error ? value.message : String(value));
}

// The single throw/exit boundary: internals return Result; here we render via ui
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

	const registryResult = createRegistry(options.plugins);
	if (!registryResult.ok) return fail(registryResult.error);
	const registry = registryResult.value;

	const pluginName = rest[0];
	const commandName = rest[1];

	if (pluginName === undefined || (globals.help && commandName === undefined)) {
		ui.print(renderRootHelp(registry.plugins));
		return 0;
	}

	if (commandName === undefined) {
		return fail(
			cliError('UNKNOWN_COMMAND', `Unknown command: "${pluginName}"`, { hint: "Run 'd6s --help' to list commands." }),
		);
	}

	const entry = registry.resolve(pluginName, commandName);

	if (entry === undefined) {
		const attempt = `${pluginName} ${commandName}`;
		const near = didYouMean(registry.commandPaths(), attempt);

		return fail(
			cliError('UNKNOWN_COMMAND', `Unknown command: "${attempt}"`, {
				hint: near !== undefined ? `Did you mean "${near}"?` : "Run 'd6s --help' to list commands.",
			}),
		);
	}

	// Everything from here — the lazy module load, arg parsing, and the command
	// body — runs inside the single catch so a rejected import() or a thrown
	// command renders as a CliError instead of escaping as an unhandled rejection.
	try {
		const command = await entry.load();

		if (globals.help) {
			ui.print(renderCommandHelp(pluginName, command));
			return 0;
		}

		const parsed = parseCommandArgs(command.args, rest.slice(2));
		if (!parsed.ok) return fail(parsed.error);

		const ctx = createContext({ cwd: options.cwd ?? process.cwd(), json: globals.json, ui });

		const outcome = await command.run({ args: parsed.value.values, positionals: parsed.value.positionals, ctx });

		// Trust a returned error no more than a thrown one: an unvalidated
		// error.exitCode of undefined would otherwise exit 0 — a failed command
		// silently reporting success.
		if (typeof outcome === 'object' && outcome !== null && outcome.ok === false) {
			return fail(toCliError(outcome.error));
		}

		return 0;
	} catch (thrown) {
		return fail(toCliError(thrown));
	}
}
