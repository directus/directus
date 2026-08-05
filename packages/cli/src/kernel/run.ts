import { dirname } from 'node:path';
import { Command, CommanderError } from 'commander';
import { version } from '../version.js';
import { type ConfigStore, createConfigStore } from './config/file.js';
import { isCI, loadProjectEnv, promptsDisabled } from './env.js';
import { CliError } from './error.js';
import { createUi, type Ui, writeOut } from './ui.js';

export interface CliContext {
	readonly cwd: string;
	/** The one config of this run: commands read and write it here instead of loading the file again. */
	readonly config: ConfigStore;
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
	const config = createConfigStore(cwd, globals.config);
	const configPath = config.path();
	loadProjectEnv(configPath !== undefined ? dirname(configPath) : cwd);

	const interactive =
		Boolean(process.stdout.isTTY) &&
		Boolean(process.stdin.isTTY) &&
		!isCI() &&
		!promptsDisabled() &&
		!globals.json &&
		globals.interactive;

	return { cwd, config, ui, interactive };
}

function normalizeHelpOption(command: Command): void {
	command.helpOption('-h, --help', 'Display help for command');

	// Calling nameAndArgs on leaf commands would add an unwanted help subcommand.
	if (command.commands.length > 0) command.helpCommand('help [command]', 'Display help for command');

	for (const sub of command.commands) normalizeHelpOption(sub);
}

function createProgram(options: RunOptions, ui: Ui): Command {
	// Align Commander's built-ins with the CLI help-text convention.
	const program = new Command('d6s')
		.exitOverride()
		.version(version, '-v, --version', 'Output the version number')
		.option('--json', 'Output machine-readable JSON')
		.option('--no-color', 'Disable colored output')
		// TTYs can exist without a human, so provide per-run and environment-wide prompt opt-outs.
		.option('--no-interactive', 'Disable interactive prompts (or set NO_INTERACTIVE)')
		.option('--config <path>', 'Path to directus.config.json')
		.configureOutput({
			// Commander routes bare-parent help through writeErr before throwing commander.help.
			writeOut,
			writeErr: writeOut,
			outputError() {},
		});

	const cwd = options.cwd ?? process.cwd();
	const getContext = (): CliContext => createContext(cwd, ui, program.opts<GlobalOptions>());

	for (const register of options.registerCommands) register(program, getContext);

	normalizeHelpOption(program);

	return program;
}

export async function run(argv: readonly string[], options: RunOptions): Promise<number> {
	const ui = createUi(scanGlobals(argv));
	const program = createProgram(options, ui);

	try {
		await program.parseAsync([...argv], { from: 'user' });
		return 0;
	} catch (thrown) {
		// Commander reports bare-parent help as exit 1 even though it is a successful help request.
		if (thrown instanceof CommanderError && (thrown.exitCode === 0 || thrown.code === 'commander.help')) return 0;

		const error = toCliError(thrown);
		ui.error(error);
		return 1;
	}
}
