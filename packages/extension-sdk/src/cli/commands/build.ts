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
import { AppExtensionType } from '@directus/shared/types';
import log from '../utils/logger';
import validateExtensionPackage from '../utils/validate-extension-package';

type BuildOptions = { type: AppExtensionType; input: string; output: string; force: boolean };

export default async function build(options: BuildOptions): Promise<void> {
	const packagePath = path.resolve('package.json');
	let packageManifest: Record<string, any> = {};

	if (!(await fse.pathExists(packagePath))) {
		log(`Current directory is not a package.`, !options.force ? 'error' : 'warn');
		if (!options.force) process.exit(1);
	} else {
		packageManifest = await fse.readJSON(packagePath);

		if (!packageManifest[EXTENSION_PKG_KEY] || !validateExtensionPackage(packageManifest[EXTENSION_PKG_KEY])) {
			log(`Current directory is not a Directus extension.`, !options.force ? 'error' : 'warn');
			if (!options.force) process.exit(1);
		}
	}

	const type = options.type || packageManifest[EXTENSION_PKG_KEY]?.type;
	const input = options.input || packageManifest[EXTENSION_PKG_KEY]?.source;
	const output = options.output || packageManifest[EXTENSION_PKG_KEY]?.path;

	if (!APP_EXTENSION_TYPES.includes(type)) {
		log(
			`Extension type ${chalk.bold(type)} is not supported. Available extension types: ${APP_EXTENSION_TYPES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			!options.force ? 'error' : 'warn'
		);
		if (!options.force) process.exit(1);
	}

	if (!(await fse.pathExists(input)) || !(await fse.stat(input)).isFile()) {
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
