import path from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import { OutputOptions as RollupOutputOptions, rollup, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import styles from 'rollup-plugin-styles';
import vue from 'rollup-plugin-vue';
import { EXTENSION_PKG_KEY, EXTENSION_TYPES, APP_SHARED_DEPS, API_SHARED_DEPS } from '@directus/shared/constants';
import { isAppExtension, isExtension, validateExtensionManifest } from '@directus/shared/utils';
import { ExtensionManifestRaw } from '@directus/shared/types';
import log from '../utils/logger';

type BuildOptions = { type: string; input: string; output: string; force: boolean };

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

	const type = options.type || extensionManifest[EXTENSION_PKG_KEY]?.type;
	const input = options.input || extensionManifest[EXTENSION_PKG_KEY]?.source;
	const output = options.output || extensionManifest[EXTENSION_PKG_KEY]?.path;

	if (!type || !isExtension(type)) {
		log(
			`Extension type ${chalk.bold(type)} does not exist. Available extension types: ${EXTENSION_TYPES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			'error'
		);
		process.exit(1);
	}

	if (!input || !(await fse.pathExists(input)) || !(await fse.stat(input)).isFile()) {
		log(`Entrypoint ${chalk.bold(input)} does not exist.`, 'error');
		process.exit(1);
	}

	if (!output) {
		log(`Output file must be a valid path.`, 'error');
		process.exit(1);
	}

	const isApp = isAppExtension(type);

	const spinner = ora('Building Directus extension...').start();

	const rollupOptions = getRollupOptions(isApp, input);
	const rollupOutputOptions = getRollupOutputOptions(isApp, output);

	const bundle = await rollup(rollupOptions);

	await bundle.write(rollupOutputOptions);

	await bundle.close();

	spinner.succeed('Done');
}

function getRollupOptions(isApp: boolean, input: string): RollupOptions {
	if (isApp) {
		return {
			input,
			external: APP_SHARED_DEPS,
			plugins: [
				vue({ preprocessStyles: true }),
				styles(),
				nodeResolve(),
				commonjs({ esmExternals: true, sourceMap: false }),
				terser(),
			],
		};
	} else {
		return {
			input,
			external: API_SHARED_DEPS,
			plugins: [nodeResolve(), commonjs({ sourceMap: false }), terser()],
		};
	}
}

function getRollupOutputOptions(isApp: boolean, output: string): RollupOutputOptions {
	if (isApp) {
		return {
			file: output,
			format: 'es',
		};
	} else {
		return {
			file: output,
			format: 'cjs',
			exports: 'default',
		};
	}
}
