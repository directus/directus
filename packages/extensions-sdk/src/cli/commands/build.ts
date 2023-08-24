import {
	API_SHARED_DEPS,
	APP_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	ExtensionManifest,
	ExtensionOptionsBundleEntries,
	HYBRID_EXTENSION_TYPES,
} from '@directus/constants';
import type {
	ApiExtensionType,
	AppExtensionType,
	ExtensionOptionsBundleEntry,
	ExtensionManifest as TExtensionManifest,
} from '@directus/types';
import { isIn, isTypeIn } from '@directus/utils';
import commonjsDefault from '@rollup/plugin-commonjs';
import jsonDefault from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replaceDefault from '@rollup/plugin-replace';
import terserDefault from '@rollup/plugin-terser';
import virtualDefault from '@rollup/plugin-virtual';
import vueDefault from '@vitejs/plugin-vue';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import path from 'path';
import type { Plugin, RollupError, RollupOptions, OutputOptions as RollupOutputOptions } from 'rollup';
import { rollup, watch as rollupWatch } from 'rollup';
import esbuildDefault from 'rollup-plugin-esbuild';
import stylesDefault from 'rollup-plugin-styles';
import type { Format, RollupConfig, RollupMode } from '../types.js';
import { getFileExt } from '../utils/file.js';
import { clear, log } from '../utils/logger.js';
import tryParseJson from '../utils/try-parse-json.js';
import generateBundleEntrypoint from './helpers/generate-bundle-entrypoint.js';
import loadConfig from './helpers/load-config.js';
import { validateSplitEntrypointOption } from './helpers/validate-cli-options.js';

// Workaround for https://github.com/rollup/plugins/issues/1329
const virtual = virtualDefault as unknown as typeof virtualDefault.default;
const vue = vueDefault as unknown as typeof vueDefault.default;
const esbuild = esbuildDefault as unknown as typeof esbuildDefault.default;
const styles = stylesDefault as unknown as typeof stylesDefault.default;
const commonjs = commonjsDefault as unknown as typeof commonjsDefault.default;
const json = jsonDefault as unknown as typeof jsonDefault.default;
const replace = replaceDefault as unknown as typeof replaceDefault.default;
const terser = terserDefault as unknown as typeof terserDefault.default;

type BuildOptions = {
	type?: string;
	input?: string;
	output?: string;
	watch?: boolean;
	minify?: boolean;
	sourcemap?: boolean;
};

export default async function build(options: BuildOptions): Promise<void> {
	const watch = options.watch ?? false;
	const sourcemap = options.sourcemap ?? false;
	const minify = options.minify ?? false;

	if (!options.type && !options.input && !options.output) {
		const packagePath = path.resolve('package.json');

		if (!(await fse.pathExists(packagePath))) {
			log(`Current directory is not a valid package.`, 'error');
			process.exit(1);
		}

		let extensionManifest: TExtensionManifest;

		try {
			extensionManifest = ExtensionManifest.parse(await fse.readJSON(packagePath));
		} catch (err) {
			log(`Current directory is not a valid Directus extension.`, 'error');
			process.exit(1);
		}

		const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

		const format = extensionManifest.type === 'module' ? 'esm' : 'cjs';

		if (extensionOptions.type === 'bundle') {
			await buildBundleExtension({
				entries: extensionOptions.entries,
				outputApp: extensionOptions.path.app,
				outputApi: extensionOptions.path.api,
				format,
				watch,
				sourcemap,
				minify,
			});
		} else if (isTypeIn(extensionOptions, HYBRID_EXTENSION_TYPES)) {
			await buildHybridExtension({
				inputApp: extensionOptions.source.app,
				inputApi: extensionOptions.source.api,
				outputApp: extensionOptions.path.app,
				outputApi: extensionOptions.path.api,
				format,
				watch,
				sourcemap,
				minify,
			});
		} else {
			await buildAppOrApiExtension({
				type: extensionOptions.type,
				input: extensionOptions.source,
				output: extensionOptions.path,
				format,
				watch,
				sourcemap,
				minify,
			});
		}
	} else {
		const type = options.type;
		const input = options.input;
		const output = options.output;

		if (!type) {
			log(`Extension type has to be specified using the ${chalk.blue('[-t, --type <type>]')} option.`, 'error');
			process.exit(1);
		}

		if (!isIn(type, EXTENSION_TYPES)) {
			log(
				`Extension type ${chalk.bold(type)} is not supported. Available extension types: ${EXTENSION_TYPES.map((t) =>
					chalk.bold.magenta(t)
				).join(', ')}.`,
				'error'
			);

			process.exit(1);
		}

		if (!input) {
			log(`Extension entrypoint has to be specified using the ${chalk.blue('[-i, --input <file>]')} option.`, 'error');
			process.exit(1);
		}

		if (!output) {
			log(
				`Extension output file has to be specified using the ${chalk.blue('[-o, --output <file>]')} option.`,
				'error'
			);

			process.exit(1);
		}

		if (type === 'bundle') {
			const entries = ExtensionOptionsBundleEntries.safeParse(tryParseJson(input));
			const splitOutput = tryParseJson(output);

			if (entries.success === false) {
				log(
					`Input option needs to be of the format ${chalk.blue(
						`[-i '[{"type":"<extension-type>","name":"<extension-name>","source":<entrypoint>}]']`
					)}.`,
					'error'
				);

				process.exit(1);
			}

			if (!validateSplitEntrypointOption(splitOutput)) {
				log(
					`Output option needs to be of the format ${chalk.blue(
						`[-o '{"app":"<app-entrypoint>","api":"<api-entrypoint>"}']`
					)}.`,
					'error'
				);

				process.exit(1);
			}

			await buildBundleExtension({
				entries: entries.data,
				outputApp: splitOutput.app,
				outputApi: splitOutput.api,
				format: 'esm',
				watch,
				sourcemap,
				minify,
			});
		} else if (isIn(type, HYBRID_EXTENSION_TYPES)) {
			const splitInput = tryParseJson(input);
			const splitOutput = tryParseJson(output);

			if (!validateSplitEntrypointOption(splitInput)) {
				log(
					`Input option needs to be of the format ${chalk.blue(
						`[-i '{"app":"<app-entrypoint>","api":"<api-entrypoint>"}']`
					)}.`,
					'error'
				);

				process.exit(1);
			}

			if (!validateSplitEntrypointOption(splitOutput)) {
				log(
					`Output option needs to be of the format ${chalk.blue(
						`[-o '{"app":"<app-entrypoint>","api":"<api-entrypoint>"}']`
					)}.`,
					'error'
				);

				process.exit(1);
			}

			await buildHybridExtension({
				inputApp: splitInput.app,
				inputApi: splitInput.api,
				outputApp: splitOutput.app,
				outputApi: splitOutput.api,
				format: 'esm',
				watch,
				sourcemap,
				minify,
			});
		} else {
			await buildAppOrApiExtension({
				type,
				input,
				output,
				format: 'esm',
				watch,
				sourcemap,
				minify,
			});
		}
	}
}

async function buildAppOrApiExtension({
	type,
	input,
	output,
	format,
	watch,
	sourcemap,
	minify,
}: {
	type: AppExtensionType | ApiExtensionType;
	input: string;
	output: string;
	format: Format;
	watch: boolean;
	sourcemap: boolean;
	minify: boolean;
}) {
	if (!(await fse.pathExists(input)) || !(await fse.stat(input)).isFile()) {
		log(`Entrypoint ${chalk.bold(input)} does not exist.`, 'error');
		process.exit(1);
	}

	if (output.length === 0) {
		log(`Output file can not be empty.`, 'error');
		process.exit(1);
	}

	const config = await loadConfig();
	const plugins = config.plugins ?? [];

	const mode = isIn(type, APP_EXTENSION_TYPES) ? 'browser' : 'node';

	const rollupOptions = getRollupOptions({ mode, input, sourcemap, minify, plugins });
	const rollupOutputOptions = getRollupOutputOptions({ mode, output, format, sourcemap });

	if (watch) {
		await watchExtension({ rollupOptions, rollupOutputOptions });
	} else {
		await buildExtension({ rollupOptions, rollupOutputOptions });
	}
}

async function buildHybridExtension({
	inputApp,
	inputApi,
	outputApp,
	outputApi,
	format,
	watch,
	sourcemap,
	minify,
}: {
	inputApp: string;
	inputApi: string;
	outputApp: string;
	outputApi: string;
	format: Format;
	watch: boolean;
	sourcemap: boolean;
	minify: boolean;
}) {
	if (!(await fse.pathExists(inputApp)) || !(await fse.stat(inputApp)).isFile()) {
		log(`App entrypoint ${chalk.bold(inputApp)} does not exist.`, 'error');
		process.exit(1);
	}

	if (!(await fse.pathExists(inputApi)) || !(await fse.stat(inputApi)).isFile()) {
		log(`API entrypoint ${chalk.bold(inputApi)} does not exist.`, 'error');
		process.exit(1);
	}

	if (outputApp.length === 0) {
		log(`App output file can not be empty.`, 'error');
		process.exit(1);
	}

	if (outputApi.length === 0) {
		log(`API output file can not be empty.`, 'error');
		process.exit(1);
	}

	const config = await loadConfig();
	const plugins = config.plugins ?? [];

	const rollupOptionsApp = getRollupOptions({
		mode: 'browser',
		input: inputApp,
		sourcemap,
		minify,
		plugins,
	});

	const rollupOptionsApi = getRollupOptions({
		mode: 'node',
		input: inputApi,
		sourcemap,
		minify,
		plugins,
	});

	const rollupOutputOptionsApp = getRollupOutputOptions({ mode: 'browser', output: outputApp, format, sourcemap });
	const rollupOutputOptionsApi = getRollupOutputOptions({ mode: 'node', output: outputApi, format, sourcemap });

	const rollupOptionsAll = [
		{ rollupOptions: rollupOptionsApp, rollupOutputOptions: rollupOutputOptionsApp },
		{ rollupOptions: rollupOptionsApi, rollupOutputOptions: rollupOutputOptionsApi },
	];

	if (watch) {
		await watchExtension(rollupOptionsAll);
	} else {
		await buildExtension(rollupOptionsAll);
	}
}

async function buildBundleExtension({
	entries,
	outputApp,
	outputApi,
	format,
	watch,
	sourcemap,
	minify,
}: {
	entries: ExtensionOptionsBundleEntry[];
	outputApp: string;
	outputApi: string;
	format: Format;
	watch: boolean;
	sourcemap: boolean;
	minify: boolean;
}) {
	if (outputApp.length === 0) {
		log(`App output file can not be empty.`, 'error');
		process.exit(1);
	}

	if (outputApi.length === 0) {
		log(`API output file can not be empty.`, 'error');
		process.exit(1);
	}

	const config = await loadConfig();
	const plugins = config.plugins ?? [];

	const entrypointApp = generateBundleEntrypoint('app', entries);
	const entrypointApi = generateBundleEntrypoint('api', entries);

	const rollupOptionsApp = getRollupOptions({
		mode: 'browser',
		input: { entry: entrypointApp },
		sourcemap,
		minify,
		plugins,
	});

	const rollupOptionsApi = getRollupOptions({
		mode: 'node',
		input: { entry: entrypointApi },
		sourcemap,
		minify,
		plugins,
	});

	const rollupOutputOptionsApp = getRollupOutputOptions({ mode: 'browser', output: outputApp, format, sourcemap });
	const rollupOutputOptionsApi = getRollupOutputOptions({ mode: 'node', output: outputApi, format, sourcemap });

	const rollupOptionsAll = [
		{ rollupOptions: rollupOptionsApp, rollupOutputOptions: rollupOutputOptionsApp },
		{ rollupOptions: rollupOptionsApi, rollupOutputOptions: rollupOutputOptionsApi },
	];

	if (watch) {
		await watchExtension(rollupOptionsAll);
	} else {
		await buildExtension(rollupOptionsAll);
	}
}

async function buildExtension(config: RollupConfig | RollupConfig[]) {
	const configs = Array.isArray(config) ? config : [config];

	const spinner = ora(chalk.bold('Building Directus extension...')).start();

	const result = await Promise.all(
		configs.map(async (c) => {
			try {
				const bundle = await rollup(c.rollupOptions);

				await bundle.write(c.rollupOutputOptions);
				await bundle.close();
			} catch (error) {
				return formatRollupError(error as RollupError);
			}

			return null;
		})
	);

	const resultErrors = result.filter((r) => r !== null);

	if (resultErrors.length > 0) {
		spinner.fail(chalk.bold('Failed'));

		log(resultErrors.join('\n\n'));

		process.exit(1);
	} else {
		spinner.succeed(chalk.bold('Done'));
	}
}

async function watchExtension(config: RollupConfig | RollupConfig[]) {
	const configs = Array.isArray(config) ? config : [config];

	const spinner = ora(chalk.bold('Building Directus extension...'));

	let buildCount = 0;

	for (const c of configs) {
		const watcher = rollupWatch({
			...c.rollupOptions,
			output: c.rollupOutputOptions,
		});

		watcher.on('event', async (event) => {
			switch (event.code) {
				case 'BUNDLE_START':
					if (buildCount === 0) {
						clear();
						spinner.start();
					}

					buildCount++;
					break;
				case 'BUNDLE_END':
					await event.result.close();

					buildCount--;

					if (buildCount === 0) {
						spinner.succeed(chalk.bold('Done'));
						log(chalk.bold.green('Watching files for changes...'));
					}

					break;

				case 'ERROR': {
					buildCount--;

					spinner.fail(chalk.bold('Failed'));
					log(formatRollupError(event.error));

					if (buildCount > 0) {
						spinner.start();
					}

					break;
				}
			}
		});
	}
}

function getRollupOptions({
	mode,
	input,
	sourcemap,
	minify,
	plugins,
}: {
	mode: RollupMode;
	input: string | Record<string, string>;
	sourcemap: boolean;
	minify: boolean;
	plugins: Plugin[];
}): RollupOptions {
	return {
		input: typeof input !== 'string' ? 'entry' : input,
		external: mode === 'browser' ? APP_SHARED_DEPS : API_SHARED_DEPS,
		plugins: [
			typeof input !== 'string' ? virtual(input) : null,
			mode === 'browser' ? vue({ isProduction: true }) : null,
			esbuild({ include: /\.tsx?$/, sourceMap: sourcemap }),
			mode === 'browser' ? styles() : null,
			...plugins,
			nodeResolve({ browser: mode === 'browser', preferBuiltins: mode === 'node' }),
			commonjs({ esmExternals: mode === 'browser', sourceMap: sourcemap }),
			json(),
			replace({
				values: {
					'process.env.NODE_ENV': JSON.stringify('production'),
				},
				preventAssignment: true,
			}),
			minify ? terser() : null,
		],
		onwarn(warning, warn) {
			if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids?.every((id) => /\bnode_modules\b/.test(id))) return;

			warn(warning);
		},
	};
}

function getRollupOutputOptions({
	mode,
	output,
	format,
	sourcemap,
}: {
	mode: RollupMode;
	output: string;
	format: Format;
	sourcemap: boolean;
}): RollupOutputOptions {
	const fileExtension = getFileExt(output);
	let outputFormat = format;

	if (mode === 'browser' || fileExtension === 'mjs') {
		outputFormat = 'esm';
	} else if (fileExtension === 'cjs') {
		outputFormat = 'cjs';
	}

	return {
		file: output,
		format: outputFormat,
		exports: 'auto',
		inlineDynamicImports: true,
		sourcemap,
	};
}

function formatRollupError(error: RollupError): string {
	let message = '';

	message += `${chalk.bold.red(`[${error.name}]`)} ${error.message}${
		error.plugin ? ` (plugin ${error.plugin})` : ''
	}\n`;

	if (error.url) {
		message += '\n' + chalk.green(error.url);
	}

	if (error.loc) {
		message += '\n' + chalk.green(`${error.loc.file ?? error.id}:${error.loc.line}:${error.loc.column}`);
	} else if (error.id) {
		message += '\n' + chalk.green(error.id);
	}

	if (error.frame) {
		message += '\n' + chalk.dim(error.frame);
	}

	if (error.stack) {
		message += '\n' + chalk.dim(error.stack);
	}

	return message;
}
