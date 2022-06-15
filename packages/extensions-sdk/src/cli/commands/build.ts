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
} from '@directus/shared/constants';
import { isIn, validateExtensionManifest } from '@directus/shared/utils';
import { ExtensionManifestRaw, ExtensionType } from '@directus/shared/types';
import { log, clear } from '../utils/logger';
import { getLanguageFromPath, isLanguage } from '../utils/languages';
import { Language } from '../types';
import loadConfig from '../utils/load-config';

type BuildOptions = {
	type: string;
	input: string;
	output: string;
	language: string;
	force: boolean;
	watch: boolean;
	minify: boolean;
	sourcemap: boolean;
};

export default async function build(options: BuildOptions): Promise<void> {
	const packagePath = path.resolve('package.json');
	let extensionManifest: ExtensionManifestRaw = {};

	if (!(await fse.pathExists(packagePath))) {
		log(`Current directory is not a package.`, !options.force ? 'error' : 'warn');
		if (!options.force) process.exit(1);
	} else {
		extensionManifest = await fse.readJSON(packagePath);

		if (!validateExtensionManifest(extensionManifest)) {
			log(`Current directory is not a Directus extension.`, !options.force ? 'error' : 'warn');
			if (!options.force) process.exit(1);
		}
	}

	const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

	const type = options.type || extensionOptions?.type;

	if (!type || !isIn(type, EXTENSION_TYPES)) {
		log(
			`Extension type ${chalk.bold(type)} does not exist. Available extension types: ${EXTENSION_TYPES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			'error'
		);
		process.exit(1);
	}

	const input = options.input || (extensionOptions as { source: string })?.source;
	const output = options.output || (extensionOptions as { path: string })?.path;

	if (!input || !(await fse.pathExists(input)) || !(await fse.stat(input)).isFile()) {
		log(`Entrypoint ${chalk.bold(input)} does not exist.`, 'error');
		process.exit(1);
	}

	if (!output) {
		log(`Output file must be a valid path.`, 'error');
		process.exit(1);
	}

	const language = options.language || getLanguageFromPath(input);

	if (!isLanguage(language)) {
		log(`Language ${chalk.bold(language)} is not supported.`, 'error');
		process.exit(1);
	}

	const config = await loadConfig();

	const spinner = ora('Building Directus extension...');

	const rollupOptions = getRollupOptions(type, language, input, config.plugins, options);
	const rollupOutputOptions = getRollupOutputOptions(type, output, options);

	if (options.watch) {
		const watcher = rollupWatch({
			...rollupOptions,
			output: rollupOutputOptions,
		});

		watcher.on('event', async (event) => {
			switch (event.code) {
				case 'BUNDLE_START':
					clear();
					spinner.start();
					break;
				case 'BUNDLE_END':
					await event.result.close();

					spinner.succeed(chalk.bold('Done'));
					log(chalk.bold.green('Watching files for changes...'));
					break;
				case 'ERROR': {
					spinner.fail(chalk.bold('Failed'));
					logRollupError(event.error);
					break;
				}
			}
		});
	} else {
		try {
			spinner.start();

			const bundle = await rollup(rollupOptions);
			await bundle.write(rollupOutputOptions);
			await bundle.close();

			spinner.succeed(chalk.bold('Done'));
		} catch (error) {
			spinner.fail(chalk.bold('Failed'));
			logRollupError(error as RollupError);

			process.exit(1);
		}
	}
}

function getRollupOptions(
	type: ExtensionType,
	language: Language,
	input: string,
	plugins: Plugin[] = [],
	options: BuildOptions
): RollupOptions {
	if (isIn(type, APP_EXTENSION_TYPES)) {
		return {
			input,
			external: APP_SHARED_DEPS,
			plugins: [
				vue({ preprocessStyles: true }),
				language === 'typescript' ? typescript({ check: false }) : null,
				styles(),
				...plugins,
				nodeResolve({ browser: true }),
				commonjs({ esmExternals: true, sourceMap: options.sourcemap }),
				json(),
				replace({
					values: {
						'process.env.NODE_ENV': JSON.stringify('production'),
					},
					preventAssignment: true,
				}),
				options.minify ? terser() : null,
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
				commonjs({ sourceMap: options.sourcemap }),
				json(),
				replace({
					values: {
						'process.env.NODE_ENV': JSON.stringify('production'),
					},
					preventAssignment: true,
				}),
				options.minify ? terser() : null,
			],
		};
	}
}

function getRollupOutputOptions(type: ExtensionType, output: string, options: BuildOptions): RollupOutputOptions {
	if (isIn(type, APP_EXTENSION_TYPES)) {
		return {
			file: output,
			format: 'es',
			inlineDynamicImports: true,
			sourcemap: options.sourcemap,
		};
	} else {
		return {
			file: output,
			format: 'cjs',
			exports: 'default',
			inlineDynamicImports: true,
			sourcemap: options.sourcemap,
		};
	}
}

function logRollupError(error: RollupError): void {
	log(`${error.plugin ? `(plugin ${error.plugin}) ` : ''}${error.name}: ${error.message}\n`, 'error');

	if (error.url) {
		log(chalk.cyan(error.url));
	}

	if (error.loc) {
		log(chalk.cyan(`${error.loc.file ?? error.id}:${error.loc.line}:${error.loc.column}`));
	} else if (error.id) {
		log(chalk.cyan(error.id));
	}

	if (error.frame) {
		log(chalk.dim(error.frame));
	}

	if (error.stack) {
		log(chalk.dim(error.stack));
	}
}
