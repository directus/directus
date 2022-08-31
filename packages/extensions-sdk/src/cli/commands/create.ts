import path from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import execa from 'execa';
import ora from 'ora';
import {
	EXTENSION_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_LANGUAGES,
	HYBRID_EXTENSION_TYPES,
	API_OR_HYBRID_EXTENSION_TYPES,
	APP_OR_HYBRID_EXTENSION_TYPES,
	EXTENSION_NAME_REGEX,
} from '@directus/shared/constants';
import { isIn } from '@directus/shared/utils';
import { ExtensionType } from '@directus/shared/types';
import { log } from '../utils/logger';
import { isLanguage, languageToShort } from '../utils/languages';
import renameMap from '../utils/rename-map';
import { Language } from '../types';
import getPackageVersion from '../utils/get-package-version';

const pkg = require('../../../../package.json');

const TEMPLATE_PATH = path.resolve(__dirname, '../../../../templates');

type CreateOptions = { language: string };

export default async function create(type: string, name: string, options: CreateOptions): Promise<void> {
	const targetDir = name.substring(name.lastIndexOf('/') + 1);
	const targetPath = path.resolve(targetDir);

	if (!isIn(type, EXTENSION_TYPES)) {
		log(
			`Extension type ${chalk.bold(type)} is not supported. Available extension types: ${EXTENSION_TYPES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			'error'
		);
		process.exit(1);
	}

	if (targetDir.length === 0) {
		log(`Extension name can not be empty.`, 'error');
		process.exit(1);
	}

	if (await fse.pathExists(targetPath)) {
		const info = await fse.stat(targetPath);

		if (!info.isDirectory()) {
			log(`Destination ${chalk.bold(targetDir)} already exists and is not a directory.`, 'error');
			process.exit(1);
		}

		const files = await fse.readdir(targetPath);

		if (files.length > 0) {
			log(`Destination ${chalk.bold(targetDir)} already exists and is not empty.`, 'error');
			process.exit(1);
		}
	}

	if (!isLanguage(options.language)) {
		log(
			`Language ${chalk.bold(options.language)} is not supported. Available languages: ${EXTENSION_LANGUAGES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			'error'
		);
		process.exit(1);
	}

	const spinner = ora(chalk.bold('Scaffolding Directus extension...')).start();

	await fse.ensureDir(targetPath);

	await fse.copy(path.join(TEMPLATE_PATH, 'common', options.language), targetPath);
	await fse.copy(path.join(TEMPLATE_PATH, type, options.language), targetPath);
	await renameMap(targetPath, (name) => (name.startsWith('_') ? `.${name.substring(1)}` : null));

	const entryPath = isIn(type, HYBRID_EXTENSION_TYPES) ? { app: 'dist/app.js', api: 'dist/api.js' } : 'dist/index.js';
	const sourcePath = isIn(type, HYBRID_EXTENSION_TYPES)
		? { app: `src/app.${languageToShort(options.language)}`, api: `src/api.${languageToShort(options.language)}` }
		: `src/index.${languageToShort(options.language)}`;

	const packageManifest = {
		name: EXTENSION_NAME_REGEX.test(name) ? name : `directus-extension-${name}`,
		version: '1.0.0',
		keywords: ['directus', 'directus-extension', `directus-custom-${type}`],
		[EXTENSION_PKG_KEY]: {
			type,
			path: entryPath,
			source: sourcePath,
			host: `^${pkg.version}`,
		},
		scripts: {
			build: 'directus-extension build',
			dev: 'directus-extension build -w --no-minify',
		},
		devDependencies: await getPackageDeps(type, options.language),
	};

	await fse.writeJSON(path.join(targetPath, 'package.json'), packageManifest, { spaces: '\t' });

	await execa('npm', ['install'], { cwd: targetPath });

	spinner.succeed(chalk.bold('Done'));

	log(`
Your ${type} extension has been created at ${chalk.green(targetPath)}

To start developing, run:
  ${chalk.blue('cd')} ${targetDir}
  ${chalk.blue('npm run')} dev

and then to build for production, run:
  ${chalk.blue('npm run')} build
	`);
}

async function getPackageDeps(type: ExtensionType, language: Language) {
	return {
		'@directus/extensions-sdk': pkg.version,
		...(language === 'typescript'
			? {
					...(isIn(type, API_OR_HYBRID_EXTENSION_TYPES)
						? { '@types/node': `^${await getPackageVersion('@types/node')}` }
						: {}),
					typescript: `^${await getPackageVersion('typescript')}`,
			  }
			: {}),
		...(isIn(type, APP_OR_HYBRID_EXTENSION_TYPES) ? { vue: `^${await getPackageVersion('vue')}` } : {}),
	};
}
