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
		name: 'directus-api',
		hidden: false,
		required: false,
	});

	const extensions = ['config', 'events', 'options', 'output', 'query', 'instances', 'help'];
	extensions.forEach((extension) =>
		runtime.addExtension(extension, require(path.join(__dirname, `core/extensions/${extension}`)))
	);

	// Uncomment to enables community CLI plugins
	// runtime.addPlugins('./node_modules', { matching: 'directus-cli-*', hidden: false });

	// add a default command first
	runtime.defaultCommand = command(
		{
			disableHelp: true,
		},
		async function (toolbox: Toolbox) {
			await toolbox.help.displayHelp();
		}
	) as any;

	const data: CommandResult<T> = {};

	try {
		const { result, output } = await runtime.run(argv);
		data.result = result.value;
		data.error = result.error;
		data.output = output;
	} catch (err) {}

	return data;
}
