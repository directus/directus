import path from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import {
	RollupError,
	RollupOptions,
	OutputOptions as RollupOutputOptions,
	Plugin,
	rollup,
	watch as rollupWatch,
} from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import styles from 'rollup-plugin-styles';
import vue from 'rollup-plugin-vue';
import {
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	APP_SHARED_DEPS,
	API_SHARED_DEPS,
	APP_EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
} from '@directus/shared/constants';
import { isIn, isTypeIn, validateExtensionManifest } from '@directus/shared/utils';
import { ApiExtensionType, AppExtensionType, ExtensionManifestRaw } from '@directus/shared/types';
import { log, clear } from '../utils/logger';
import { getLanguageFromPath, isLanguage } from '../utils/languages';
import { Language, RollupConfig, RollupMode } from '../types';
import loadConfig from '../utils/load-config';
import toObject from '../utils/to-object';

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
		let extensionManifest: ExtensionManifestRaw = {};

		if (!(await fse.pathExists(packagePath))) {
			log(`Current directory is not a valid package.`, 'error');
			process.exit(1);
		} else {
			extensionManifest = await fse.readJSON(packagePath);

			if (!validateExtensionManifest(extensionManifest)) {
				log(`Current directory is not a valid Directus extension.`, 'error');
				process.exit(1);
			}
		}

		const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

		if (!isTypeIn(extensionOptions, EXTENSION_TYPES)) {
			log(
				`Extension type ${chalk.bold(
					extensionOptions.type
				)} is not supported. Available extension types: ${EXTENSION_TYPES.map((t) => chalk.bold.magenta(t)).join(
					', '
				)}.`,
				'error'
			);
			process.exit(1);
		}

		if (isTypeIn(extensionOptions, HYBRID_EXTENSION_TYPES)) {
			await buildHybridExtension({
				inputApp: extensionOptions.source.app,
				inputApi: extensionOptions.source.api,
				outputApp: extensionOptions.path.app,
				outputApi: extensionOptions.path.api,
				watch,
				sourcemap,
				minify,
			});
		} else {
			await buildAppOrApiExtension({
				type: extensionOptions.type,
				input: extensionOptions.source,
				output: extensionOptions.path,
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
		} else if (!isIn(type, EXTENSION_TYPES)) {
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

		if (isIn(type, HYBRID_EXTENSION_TYPES)) {
			const inputObject = toObject(input);
			const outputObject = toObject(output);

			if (!inputObject || !inputObject.app || !inputObject.api) {
				log(
					`Input option needs to be of the format ${chalk.blue('[-i app:<app-entrypoint>,api:<api-entrypoint>]')}.`,
					'error'
				);
				process.exit(1);
			}
			if (!outputObject || !outputObject.app || !outputObject.api) {
				log(
					`Output option needs to be of the format ${chalk.blue('[-o app:<app-output-file>,api:<api-output-file>]')}.`,
					'error'
				);
				process.exit(1);
			}

			await buildHybridExtension({
				inputApp: inputObject.app,
				inputApi: inputObject.api,
				outputApp: outputObject.app,
				outputApi: outputObject.api,
				watch,
				sourcemap,
				minify,
			});
		} else {
			await buildAppOrApiExtension({
				type,
				input,
				output,
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
	watch,
	sourcemap,
	minify,
}: {
	type: AppExtensionType | ApiExtensionType;
	input: string;
	output: string;
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

	const language = getLanguageFromPath(input);

	if (!isLanguage(language)) {
		log(`Language ${chalk.bold(language)} is not supported.`, 'error');
		process.exit(1);
	}

	const config = await loadConfig();
	const plugins = config.plugins ?? [];

	const mode = isIn(type, APP_EXTENSION_TYPES) ? 'browser' : 'node';

	const rollupOptions = getRollupOptions({ mode, input, language, sourcemap, minify, plugins });
	const rollupOutputOptions = getRollupOutputOptions({ mode, output, sourcemap });

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
	watch,
	sourcemap,
	minify,
}: {
	inputApp: string;
	inputApi: string;
	outputApp: string;
	outputApi: string;
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

	const languageApp = getLanguageFromPath(inputApp);
	const languageApi = getLanguageFromPath(inputApi);

	if (!isLanguage(languageApp)) {
		log(`App language ${chalk.bold(languageApp)} is not supported.`, 'error');
		process.exit(1);
	}
	if (!isLanguage(languageApi)) {
		log(`API language ${chalk.bold(languageApp)} is not supported.`, 'error');
		process.exit(1);
	}

	const config = await loadConfig();
	const plugins = config.plugins ?? [];

	const rollupOptionsApp = getRollupOptions({
		mode: 'browser',
		input: inputApp,
		language: languageApp,
		sourcemap,
		minify,
		plugins,
	});
	const rollupOptionsApi = getRollupOptions({
		mode: 'node',
		input: inputApi,
		language: languageApi,
		sourcemap,
		minify,
		plugins,
	});
	const rollupOutputOptionsApp = getRollupOutputOptions({ mode: 'browser', output: outputApp, sourcemap });
	const rollupOutputOptionsApi = getRollupOutputOptions({ mode: 'node', output: outputApi, sourcemap });

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
	language,
	sourcemap,
	minify,
	plugins,
}: {
	mode: RollupMode;
	input: string;
	language: Language;
	sourcemap: boolean;
	minify: boolean;
	plugins: Plugin[];
}): RollupOptions {
	if (mode === 'browser') {
		return {
			input,
			external: APP_SHARED_DEPS,
			plugins: [
				vue({ preprocessStyles: true }),
				language === 'typescript' ? typescript({ check: false }) : null,
				styles(),
				...plugins,
				nodeResolve({ browser: true }),
				commonjs({ esmExternals: true, sourceMap: sourcemap }),
				json(),
				replace({
					values: {
						'process.env.NODE_ENV': JSON.stringify('production'),
					},
					preventAssignment: true,
				}),
				minify ? terser() : null,
			],
		};
	} else {
		return {
			input,
			external: API_SHARED_DEPS,
			plugins: [
				language === 'typescript' ? typescript({ check: false }) : null,
				...plugins,
				nodeResolve(),
				commonjs({ sourceMap: sourcemap }),
				json(),
				replace({
					values: {
						'process.env.NODE_ENV': JSON.stringify('production'),
					},
					preventAssignment: true,
				}),
				minify ? terser() : null,
			],
		};
	}
}

function getRollupOutputOptions({
	mode,
	output,
	sourcemap,
}: {
	mode: RollupMode;
	output: string;
	sourcemap: boolean;
}): RollupOutputOptions {
	if (mode === 'browser') {
		return {
			file: output,
			format: 'es',
			inlineDynamicImports: true,
			sourcemap,
		};
	} else {
		return {
			file: output,
			format: 'cjs',
			exports: 'default',
			inlineDynamicImports: true,
			sourcemap,
		};
	}
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
