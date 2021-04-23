import * as path from 'path';

import { build } from 'gluegun';
import { command } from './core/command';
import { Toolbox } from './toolbox';
import { IOutput } from './output';
import { CLIError } from './core/exceptions';

export type Result<T extends any> = {
	error?: CLIError;
	output?: IOutput;
	result?: T;
};

export default async function <T extends any>(argv: string[]): Promise<Result<T>> {
	// create a runtime
	const runtime = build('directus')
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

	runtime.addPlugin('./node_modules/directus/dist/cli', {
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

	const data: Result<T> = {};

	try {
		const { result, output } = await runtime.run(argv);
		data.result = result.value;
		data.error = result.error;
		data.output = output;
	} catch (err) {}

	return data;
}
