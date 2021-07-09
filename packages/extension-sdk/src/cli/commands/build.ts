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
import { isAppExtension } from '@directus/shared/utils';
import { ExtensionManifest } from '@directus/shared/types';
import log from '../utils/logger';
import validateExtensionManifest from '../utils/validate-extension-manifest';

type BuildOptions = { type: string; input: string; output: string; force: boolean };

export default async function build(options: BuildOptions): Promise<void> {
	const packagePath = path.resolve('package.json');
	let extensionManifest: ExtensionManifest = {};

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

	if (!type || !isAppExtension(type)) {
		log(
			`Extension type ${chalk.bold(type)} is not supported. Available extension types: ${APP_EXTENSION_TYPES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			!options.force ? 'error' : 'warn'
		);
		if (!options.force) process.exit(1);
	}

	if (!input || !(await fse.pathExists(input)) || !(await fse.stat(input)).isFile()) {
		log(`Entrypoint ${chalk.bold(input)} does not exist.`, 'error');
		process.exit(1);
	}

	if (!output) {
		log(`Output file must be a valid path.`, 'error');
		process.exit(1);
	}

	const spinner = ora('Building Directus extension...').start();

	const bundle = await rollup({
		input,
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
		file: output,
	});

	await bundle.close();

	spinner.succeed('Done');
}
