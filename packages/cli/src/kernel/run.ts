import { dirname, resolve } from 'node:path';
import { Command, CommanderError } from 'commander';
import { version } from '../version.js';
import { findConfigPath } from './config/file.js';
import { isCI, loadProjectEnv } from './env.js';
import { CliError } from './error.js';
import { createUi, type Ui, writeOut } from './ui.js';

export interface CliContext {
	readonly cwd: string;
	readonly configPath: string | undefined;
	readonly ui: Ui;
	readonly interactive: boolean;
}

type CommandRegistrar = (program: Command, getContext: () => CliContext) => void;

interface RunOptions {
	readonly registerCommands: readonly CommandRegistrar[];
	readonly cwd?: string;
}

interface GlobalOptions {
	readonly json?: boolean;
	readonly color: boolean;
	readonly interactive: boolean;
	readonly config?: string;
}

// Parse errors need their output mode before Commander parses the arguments.
function scanGlobals(argv: readonly string[]): { json: boolean; color: boolean } {
	const terminator = argv.indexOf('--');
	const tokens = terminator === -1 ? argv : argv.slice(0, terminator);
	return { json: tokens.includes('--json'), color: !tokens.includes('--no-color') };
}

function toCliError(error: unknown): CliError {
	if (error instanceof CliError) return error;

	if (error instanceof CommanderError) {
		const code = error.code === 'commander.unknownCommand' ? 'UNKNOWN_COMMAND' : 'USAGE';
		let message = error.message.replace(/^error: /, '');

		if (error.code === 'commander.unknownOption') {
			const option = /^unknown option '([^'=]+)=/.exec(message)?.[1];
			if (message.includes('='))
				message = option === undefined ? 'unknown option with inline value' : `unknown option '${option}=***'`;
		}

		return new CliError(code, message);
	}

	return new CliError('UNKNOWN', error instanceof Error ? error.message : String(error));
}

function createContext(cwd: string, ui: Ui, globals: GlobalOptions): CliContext {
	const configPath = globals.config !== undefined ? resolve(cwd, globals.config) : findConfigPath(cwd);
	loadProjectEnv(configPath !== undefined ? dirname(configPath) : cwd);

	const interactive =
		Boolean(process.stdout.isTTY) && Boolean(process.stdin.isTTY) && !isCI() && !globals.json && globals.interactive;

	return { cwd, configPath, ui, interactive };
}

function createProgram(options: RunOptions, ui: Ui): Command {
	const program = new Command('d6s')
		.exitOverride()
		.version(version, '-v, --version')
		.option('--json', 'Output machine-readable JSON.')
		.option('--no-color', 'Disable colored output.')
		.option('--no-interactive', 'Disable interactive prompts.')
		.option('--config <path>', 'Path to directus.config.json.')
		.configureOutput({
			// Commander sends bare-parent help to writeErr before throwing
			// commander.help. Route it to redacted stdout; actual errors are suppressed
			// below and rendered through Ui. Subcommands inherit this configuration.
			writeOut,
			writeErr: writeOut,
			outputError() {
				// Commander errors are rendered by the run() boundary as CliError.
			},
		});

	const cwd = options.cwd ?? process.cwd();
	const getContext = (): CliContext => createContext(cwd, ui, program.opts<GlobalOptions>());

	for (const register of options.registerCommands) register(program, getContext);

	return program;
}

export async function run(argv: readonly string[], options: RunOptions): Promise<number> {
	const ui = createUi(scanGlobals(argv));
	const program = createProgram(options, ui);

	try {
		await program.parseAsync([...argv], { from: 'user' });
		return 0;
	} catch (thrown) {
		// Explicit help/version exit 0. Commander emits bare parent help as a
		// commander.help exit 1; it is still a successful request for guidance.
		if (thrown instanceof CommanderError && (thrown.exitCode === 0 || thrown.code === 'commander.help')) return 0;

		const error = toCliError(thrown);
		ui.error(error);
		return 1;
	}
}
