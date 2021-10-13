import * as fs from 'fs';
import * as path from 'path';

// @ts-ignore
import amp = require('app-module-path');
amp.addPath(`${__dirname}/../node_modules`);
amp.addPath(`${process.cwd()}/node_modules`);
amp.addPath(process.cwd());

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
	} catch {
		//
	}
	return false;
}

export default async function <T>(argv: string[]): Promise<CommandResult<T>> {
	// create a runtime
	const brand = 'directusctl';
	const runtime = build(brand)
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

	const events = new Events();
	const options = new Options(events, process.argv);
	const output = new Output(options);

	let extensionsPath = process.env.EXTENSIONS_PATH ?? './extensions';

	if (config.project.data.experimental?.cli?.typescript?.enabled) {
		const project = config.project.data.experimental?.cli?.typescript.tsconfig || './tsconfig.json';
		if (fs.existsSync(project)) {
			if (!hasTsNode()) {
				if (!fs.existsSync('./node_modules/ts-node')) {
					const error = new CLIRuntimeError(`
						You're using experimental typescript support on the cli, but we couldn't find "ts-node" package installed.
						Please make sure to install it before proceeding.
					`);
					await output.error(error);
					return {
						output,
						error,
					};
				}

				require('ts-node').register({
					project: path.resolve(project),
				});
			}
		} else {
			throw new CLIRuntimeError(`
				You're using experimental typescript support on the cli, but we couldn't find the typescript project file.
				Please make sure to configure it properly. The current value is "${project}"
			`);
		}

		extensionsPath = path.resolve(config.project.data.experimental?.cli?.typescript?.source || extensionsPath);
	}

	const loading = {
		state: false,
	};

	// Workaround stupid bug in gluegun
	// @ts-ignore
	const list = require('fs-jetpack/lib/list');
	const shimmer = require('shimmer');
	shimmer.wrap(list, 'sync', (original: (...args: any[]) => any) => {
		return function (this: any, ...args: any[]) {
			const result = original.apply(this, args) as string[];
			if (!loading.state) {
				return result;
			}

			const folder = args[0] as string;

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

	const extensions = ['config', 'events', 'options', 'output', 'query', 'stdin', 'instances', 'help'];
	extensions.forEach((extension) =>
		runtime.addExtension(extension, require(path.join(__dirname, `core/extensions/${extension}`)))
	);

	if (config.project.data.experimental?.cli?.community_extensions) {
		// This isn't decided yet, please don't publish packages to npm until we have decided
		// if we'll have a naming pattern and what it's going to be.
		// TODO: Disabled to discourage usage/tests until final release and decision regarding this
		// runtime.addPlugins('./node_modules', { matching: 'directus-cli-*', hidden: false });
		// runtime.addPlugins('./node_modules', { matching: 'directus-*-cli', hidden: false });
		// runtime.addPlugins('./node_modules', { matching: '@directus/*-cli', hidden: false });
		// runtime.addPlugins('./node_modules', { matching: '@directus/cli-*', hidden: false });
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
			if (array && array.length) {
				let suggestion = [''];
				const suggestions = (await help.suggest(array)).filter(({ score }) => score >= 0.8);
				if (suggestions.length > 0) {
					if (suggestions[0]!.score >= 1) {
						suggestion = [`\nDid you mean "${brand} ${suggestions[0]?.suggestion}"?`];
					} else {
						suggestion = [
							`\n\nDid you mean any of the following ones?\n`,
							...suggestions.map(({ suggestion }) => `- ${brand} ${suggestion}`),
						];
					}
				}

				throw new CLIRuntimeError(`Unknown command: "${brand} ${array.join(' ')}"${suggestion.join('\n')}`);
			}

			await help.displayHelp();
		}
	) as any;

	const commandResult: CommandResult<T> = {};

	try {
		const { result, output } = await runtime.run(argv);
		commandResult.help = result.help;
		commandResult.result = result.data;
		commandResult.error = result.error;
		commandResult.output = output;
	} catch {
		//
	}

	return commandResult;
}
