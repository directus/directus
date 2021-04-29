import * as fs from 'fs';
import * as path from 'path';

import { build } from 'gluegun';
import { command } from './core/command';
import { Toolbox } from './toolbox';
import { CommandResult } from './command';
import { CLIRuntimeError } from './core/exceptions';

export { command } from './core/command';
export type { Toolbox } from './toolbox';

import * as config from './core/extensions/config';
import { Output } from './core/output';
import { Options } from './core/options';
import { Events } from './core/events';

export * from './command';
export * from './config';
export * from './events';
export * from './help';
export * from './options';
export * from './output';
export * from './toolbox';

function hasTsNode(): boolean {
	try {
		if ((process as any)[Symbol.for('ts-node.register.instance')]) {
			return true;
		}
	} catch {}
	return false;
}

export default async function <T extends any>(argv: string[]): Promise<CommandResult<T>> {
	// create a runtime
	const runtime = build('directusctl')
		.exclude([
			'meta',
			'strings',
			'print',
			'filesystem',
			'semver',
			'system',
			'prompt',
			'http',
			'template',
			'patching',
			'package-manager',
		])
		.create();

	let events = new Events();
	let options = new Options(events, process.argv);
	let output = new Output(options);

	let extensionsPath = process.env.EXTENSIONS_PATH ?? './extensions';

	if (config.project.data.experimental?.typescript?.tsconfig) {
		const project = config.project.data.experimental.typescript.tsconfig;
		if (fs.existsSync(project)) {
			if (!fs.existsSync('./node_modules/ts-node')) {
				const error = new Error("Couldn't find ts-node package");
				await output.error(error);
				return {
					output,
					error,
				};
			}

			if (!hasTsNode()) {
				require('ts-node').register({
					project: path.resolve(project),
				});
			}
		}
	}

	const loading = {
		state: false,
	};

	// Workaround stupid bug in gluegun
	// @ts-ignore
	const list = require('fs-jetpack/lib/list');
	const shimmer = require('shimmer');
	shimmer.wrap(list, 'sync', (original: Function) => {
		return function (this: any) {
			const result = original.apply(this, arguments) as string[];
			if (!loading.state) {
				return result;
			}

			const folder = arguments[0] as string;

			const ts = hasTsNode();
			const files = result.filter((file: string) => {
				if (fs.statSync(path.join(folder, file)).isDirectory()) {
					return true;
				}

				if (!ts) {
					return file.endsWith('.js');
				}

				if (file.endsWith('.ts')) {
					if (file.endsWith('.d.ts')) {
						return false;
					}
					return true;
				}

				if (file.endsWith('.js')) {
					// only allow .js if there's no matching .ts
					return result.indexOf(`${file.substr(0, file.length - 3)}.ts`) < 0;
				}

				return false;
			});

			return files;
		};
	});

	loading.state = true;

	// no exclusions
	runtime.addDefaultPlugin(path.join(__dirname, 'cli'), {
		name: 'directus',
		hidden: false,
	});

	runtime.addPlugin('./node_modules/directus/dist/cli/new', {
		name: 'directus-server',
		hidden: false,
		required: false,
	});

	const extensions = ['config', 'events', 'options', 'output', 'query', 'instances', 'help'];
	extensions.forEach((extension) =>
		runtime.addExtension(extension, require(path.join(__dirname, `core/extensions/${extension}`)))
	);

	if (config.project.data.experimental?.community_extensions) {
		runtime.addPlugins('./node_modules', { matching: 'directus-cli-*', hidden: false });
		runtime.addPlugins('./node_modules', { matching: 'directus-*-cli', hidden: false });
		runtime.addPlugins('./node_modules', { matching: '@directus/*-cli', hidden: false });
		runtime.addPlugins('./node_modules', { matching: '@directus/cli-*', hidden: false });
	}

	const cliExtensionDir = path.resolve(extensionsPath, 'cli');
	if (fs.existsSync(cliExtensionDir)) {
		runtime.addPlugin(cliExtensionDir, {
			name: 'directus-project',
			hidden: false,
			required: false,
		});
	}

	loading.state = false;

	// add a default command first
	runtime.defaultCommand = command(
		{
			disableHelp: true,
		},
		async function ({ help, parameters: { array } }: Toolbox) {
			await help.displayHelp();
			if (array && array.length) {
				throw new CLIRuntimeError(`Unknown command: ${array.join(' ')}`);
			}
		}
	) as any;

	const commandResult: CommandResult<T> = {};

	try {
		const { result, output } = await runtime.run(argv);
		commandResult.help = result.help;
		commandResult.result = result.data;
		commandResult.error = result.error;
		commandResult.output = output;
	} catch (err) {}

	return commandResult;
}
