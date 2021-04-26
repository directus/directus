import * as path from 'path';

import { build } from 'gluegun';
import { command } from './core/command';
import { Toolbox } from './toolbox';
import { CommandResult } from './command';

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

	if (process.env.ENABLE_COMMUNITY_EXTENSIONS) {
		runtime.addPlugins('./node_modules', { matching: 'directus-cli-*', hidden: false });
		runtime.addPlugins('./node_modules', { matching: 'directus-*-cli', hidden: false });
		runtime.addPlugins('./node_modules', { matching: '@directus/*-cli', hidden: false });
		runtime.addPlugins('./node_modules', { matching: '@directus/cli-*', hidden: false });
	}

	const extensionsDir = path.resolve(process.env.EXTENSIONS_PATH ?? './extensions', 'cli');
	runtime.addPlugin(extensionsDir, {
		name: 'directus-project',
		hidden: false,
		required: false,
	});

	// add a default command first
	runtime.defaultCommand = command(
		{
			disableHelp: true,
		},
		async function (toolbox: Toolbox) {
			return await toolbox.help.displayHelp();
		}
	) as any;

	const commandResult: CommandResult<T> = {};

	try {
		const { result, output } = await runtime.run(argv);
		commandResult.help = result.help;
		commandResult.data = result.data;
		commandResult.error = result.error;
		commandResult.output = output;
	} catch (err) {}

	return commandResult;
}
