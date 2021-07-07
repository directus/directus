/* eslint-disable no-console */

import path from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import styles from 'rollup-plugin-styles';
import vue from 'rollup-plugin-vue';
import { APP_EXTENSION_TYPES, EXTENSION_PKG_KEY, SHARED_DEPS } from '@directus/shared/constants';

export default async function build(options: { input: string; output: string }): Promise<void> {
	const packagePath = path.resolve('package.json');

	if (!(await fse.pathExists(packagePath))) {
		console.log(`${chalk.bold.red('[Error]')} Current directory is not a package.`);
		process.exit(1);
	}

	const packageManifest = await fse.readJSON(packagePath);

	if (!packageManifest[EXTENSION_PKG_KEY] || !packageManifest[EXTENSION_PKG_KEY].type) {
		console.log(`${chalk.bold.yellow('[Warn]')} Current directory is not a Directus extension.`);
	} else {
		const type = packageManifest[EXTENSION_PKG_KEY].type;

		if (!APP_EXTENSION_TYPES.includes(type)) {
			console.log(
				`${chalk.bold.yellow('[Warn]')} Extension type ${chalk.bold(
					type
				)} is not supported. Available extension types: ${APP_EXTENSION_TYPES.map((t) => chalk.bold.magenta(t)).join(
					', '
				)}.`
			);
		}
	}

	const spinner = ora('Building Directus extension...').start();

	const bundle = await rollup({
		input: options.input,
		external: SHARED_DEPS,
		plugins: [
			vue({ preprocessStyles: true }),
			styles(),
			nodeResolve(),
			commonjs({ esmExternals: true, sourceMap: false }),
			terser(),
		],
	});

	await bundle.write({
		format: 'es',
		file: options.output,
	});

	await bundle.close();

	spinner.succeed('Done');
}
