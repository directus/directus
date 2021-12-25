/**
 * This should move to it's own class to be testable.
 * Had to rewrite due to last approach throwing randomly on linux machines.
 */

import redent from 'redent';
import { Readable } from 'stream';
import { Toolbox } from '../../toolbox';
import { CLIRuntimeError } from '../exceptions';
import { parseJson, parseYaml } from '../parsers';

export const SupportedFormats = ['binary', 'json', 'stream', 'text', 'yaml'] as const;

export type StdinFeature = {
	description?: string;
	formats: StdinFormats | StdinFormats[];
	required?: boolean;
	exclusive?: string | string[];
};

export type StdinFeatures = {
	[name: string]: StdinFeature;
};

export type StdinFormats = typeof SupportedFormats[number];

export function normalizeFeatures(requested?: StdinFeatures): StdinFeatures {
	if (!requested) {
		return {};
	}

	const options = Object.keys(requested);

	const required = Object.entries(requested)
		.filter(([_, feature]) => !!feature.required)
		.map(([name]) => name);

	if (required.length > 1) {
		throw new CLIRuntimeError(`Implementation error: can't require multiple stdin options (${required.join(', ')})`);
	}

	if (required.length > 0 && options.length > 1) {
		throw new CLIRuntimeError(`Implementation error: can't have multiple stdin options if one is required`);
	}

	return Object.entries(requested)
		.map(([name, feature]) => {
			feature.description =
				feature.description ||
				`
					Used to pass content to the command. To understand how this works
					in this context, please check the command usage & documentation.

					# Examples

					## Load content from a file

					\`\`\`
					$ cat file | <command> --${name}=<format>
					\`\`\`
				`;

			feature.description = redent(feature.description);
			feature.exclusive = feature.exclusive || [];
			if (!Array.isArray(feature.exclusive)) {
				feature.exclusive = [feature.exclusive];
			}

			const exclusive = options.filter((opt) => opt != name).concat(...feature.exclusive);
			if (exclusive.length) {
				feature.description =
					feature.description +
					`\n**This can't be used together with the following options**\n\n` +
					exclusive.map((opt) => `- --${opt}`).join('\n');
			}

			let supported = feature.formats;
			if (!Array.isArray(supported)) {
				if (typeof supported != 'string') {
					throw new CLIRuntimeError(`Implementation error: invalid ${name} stdin format type (${typeof supported})`);
				}
				supported = [supported];
			}

			supported.forEach((format) => {
				if (typeof format != 'string') {
					throw new CLIRuntimeError(`Implementation error: invalid ${name} stdin format type (${typeof supported})`);
				} else if (SupportedFormats.indexOf(format) < 0) {
					throw new CLIRuntimeError(`Unsupported stdin format: ${format}`);
				}
			});

			feature.formats = supported;
			return {
				name,
				feature,
			};
		})
		.filter((format) => format.feature.formats.length > 0)
		.reduce(
			(prev, curr) =>
				Object.assign(prev, {
					[curr.name]: curr.feature,
				}),
			{} as {
				[name: string]: StdinFeature;
			}
		);
}

async function readBuffer(stream: Readable): Promise<Buffer> {
	const chunks = [] as Buffer[];
	stream.on('data', (chunk: Buffer) => chunks.push(chunk));
	return await new Promise((resolve, reject) => {
		stream.on('end', () => resolve(Buffer.concat(chunks)));
		stream.on('error', () => reject(new CLIRuntimeError('Error reading stdin')));
		stream.on('timeout', () => reject(new CLIRuntimeError('Timeout reading stdin')));
		stream.resume();
	});
}

export default (toolbox: Toolbox): void => {
	toolbox.stdin = undefined;

	toolbox.options.register((builder, command) => {
		const features = Object.entries(normalizeFeatures(command.settings?.features?.stdin));

		features.forEach(([name, feature]) => {
			if (feature.formats.length == 1) {
				builder = builder.option(name, {
					type: 'boolean',
					description: feature.description,
					demandOption: feature.required,
				});
			} else {
				builder = builder.option(name, {
					type: 'string',
					choices: feature.formats as string[],
					description: feature.description,
					demandOption: feature.required,
				});
			}
		});
		return builder;
	});

	toolbox.events.on('command.execute.before', async (command, options) => {
		const features = normalizeFeatures(command.settings?.features?.stdin);
		const found = Object.keys(features).filter((key) => key in options);

		const toFlags = (keys: string[]) => keys.map((k) => `--${k}`).join(', ');

		if (!found.length) {
			return; // No stdin options passed
		} else if (found.length > 1) {
			throw new CLIRuntimeError(`These options are mutually exclusive: ${toFlags(found)}`);
		}

		const key = found[0]!;
		const feature = features[key]!;
		const conflicts = (feature.exclusive as string[]).filter((key) => key in options);
		if (conflicts.length > 0) {
			throw new CLIRuntimeError(`You can't use these options with --${key}: ${toFlags(conflicts)}`);
		}

		let requested = options[key] as StdinFormats | boolean;
		if (feature.formats.length == 1) {
			if (typeof requested !== 'boolean' || !requested) {
				throw new CLIRuntimeError(`Unknown stdin format "${requested}"`);
			}
			requested = feature.formats[0] as StdinFormats;
		} else {
			if (feature.formats.indexOf(`${requested}` as StdinFormats) < 0) {
				throw new CLIRuntimeError(`Unsupported format ${requested} on --${key}`);
			}
		}

		if (!process.stdin.readable) {
			throw new CLIRuntimeError('Unable to open stdin stream.');
		}

		if (requested === 'json') {
			toolbox.stdin = parseJson((await readBuffer(process.stdin)).toString());
		} else if (requested === 'yaml') {
			toolbox.stdin = parseYaml((await readBuffer(process.stdin)).toString());
		} else if (requested === 'text') {
			toolbox.stdin = (await readBuffer(process.stdin)).toString();
		} else if (requested === 'binary') {
			toolbox.stdin = await readBuffer(process.stdin);
		} else if (requested === 'stream') {
			toolbox.stdin = process.stdin;
		} else {
			throw new CLIRuntimeError(`Unknown stdin format: ${requested}`);
		}
	});
};
