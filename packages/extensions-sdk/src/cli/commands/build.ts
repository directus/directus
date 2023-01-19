import {
	API_SHARED_DEPS,
	APP_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
} from '@directus/shared/constants';
import {
	ApiExtensionType,
	AppExtensionType,
	ExtensionManifest,
	ExtensionOptionsBundleEntries,
	ExtensionOptionsBundleEntry,
} from '@directus/shared/types';
import { isIn, isTypeIn } from '@directus/shared/utils';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import virtual from '@rollup/plugin-virtual';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import path from 'path';
import {
	OutputOptions as RollupOutputOptions,
	Plugin,
	rollup,
	RollupError,
	RollupOptions,
	watch as rollupWatch,
} from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import styles from 'rollup-plugin-styles';
import vue from 'rollup-plugin-vue';
import { Language, RollupConfig, RollupMode } from '../types';
import { getLanguageFromPath, isLanguage } from '../utils/languages';
import { clear, log } from '../utils/logger';
import tryParseJson from '../utils/try-parse-json';
import generateBundleEntrypoint from './helpers/generate-bundle-entrypoint';
import loadConfig from './helpers/load-config';
import { validateSplitEntrypointOption } from './helpers/validate-cli-options';

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

		let extensionManifest: ExtensionManifest;

		try {
			extensionManifest = ExtensionManifest.parse(await fse.readJSON(packagePath));
		} catch (err) {
			log(`Current directory is not a valid Directus extension.`, 'error');
			process.exit(1);
		}

		const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

		if (extensionOptions.type === 'bundle') {
			await buildBundleExtension({
				entries: extensionOptions.entries,
				outputApp: extensionOptions.path.app,
				outputApi: extensionOptions.path.api,
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
		log(`API language ${chalk.bold(languageApi)} is not supported.`, 'error');
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

async function buildBundleExtension({
	entries,
	outputApp,
	outputApi,
	watch,
	sourcemap,
	minify,
}: {
	entries: ExtensionOptionsBundleEntry[];
	outputApp: string;
	outputApi: string;
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

	const languagesApp = new Set<Language>();
	const languagesApi = new Set<Language>();

	for (const entry of entries) {
		if (isTypeIn(entry, HYBRID_EXTENSION_TYPES)) {
			const inputApp = entry.source.app;
			const inputApi = entry.source.api;

			if (!(await fse.pathExists(inputApp)) || !(await fse.stat(inputApp)).isFile()) {
				log(`App entrypoint ${chalk.bold(inputApp)} does not exist.`, 'error');
				process.exit(1);
			}
			if (!(await fse.pathExists(inputApi)) || !(await fse.stat(inputApi)).isFile()) {
				log(`API entrypoint ${chalk.bold(inputApi)} does not exist.`, 'error');
				process.exit(1);
			}

			const languageApp = getLanguageFromPath(inputApp);
			const languageApi = getLanguageFromPath(inputApi);

			if (!isLanguage(languageApp)) {
				log(`App language ${chalk.bold(languageApp)} is not supported.`, 'error');
				process.exit(1);
			}
			if (!isLanguage(languageApi)) {
				log(`API language ${chalk.bold(languageApi)} is not supported.`, 'error');
				process.exit(1);
			}

			languagesApp.add(languageApp);
			languagesApi.add(languageApi);
		} else {
			const input = entry.source;

			if (!(await fse.pathExists(input)) || !(await fse.stat(input)).isFile()) {
				log(`Entrypoint ${chalk.bold(input)} does not exist.`, 'error');
				process.exit(1);
			}

			const language = getLanguageFromPath(input);

			if (!isLanguage(language)) {
				log(`Language ${chalk.bold(language)} is not supported.`, 'error');
				process.exit(1);
			}

			if (isIn(entry.type, APP_EXTENSION_TYPES)) {
				languagesApp.add(language);
			} else {
				languagesApi.add(language);
			}
		}
	}

	const config = await loadConfig();
	const plugins = config.plugins ?? [];

	const entrypointApp = generateBundleEntrypoint('app', entries);
	const entrypointApi = generateBundleEntrypoint('api', entries);

	const rollupOptionsApp = getRollupOptions({
		mode: 'browser',
		input: { entry: entrypointApp },
		language: Array.from(languagesApp),
		sourcemap,
		minify,
		plugins,
	});
	const rollupOptionsApi = getRollupOptions({
		mode: 'node',
		input: { entry: entrypointApi },
		language: Array.from(languagesApi),
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
	input: string | Record<string, string>;
	language: Language | Language[];
	sourcemap: boolean;
	minify: boolean;
	plugins: Plugin[];
}): RollupOptions {
	const languages = Array.isArray(language) ? language : [language];

	return {
		input: typeof input !== 'string' ? 'entry' : input,
		external: mode === 'browser' ? APP_SHARED_DEPS : API_SHARED_DEPS,
		plugins: [
			typeof input !== 'string' ? virtual(input) : null,
			mode === 'browser' ? (vue({ preprocessStyles: true }) as Plugin) : null,
			languages.includes('typescript') ? esbuild({ include: /\.tsx?$/, sourceMap: sourcemap }) : null,
			mode === 'browser' ? styles() : null,
			...plugins,
			nodeResolve({ browser: mode === 'browser' }),
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
	};
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
	return {
		file: output,
		format: mode === 'browser' ? 'es' : 'cjs',
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
