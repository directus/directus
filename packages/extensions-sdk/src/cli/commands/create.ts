import path from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import execa from 'execa';
import ora from 'ora';
import {
	EXTENSION_PKG_KEY,
	EXTENSION_LANGUAGES,
	HYBRID_EXTENSION_TYPES,
	API_OR_HYBRID_EXTENSION_TYPES,
	APP_OR_HYBRID_EXTENSION_TYPES,
	EXTENSION_NAME_REGEX,
	EXTENSION_PACKAGE_TYPES,
	PACKAGE_EXTENSION_TYPES,
} from '@directus/shared/constants';
import { isIn } from '@directus/shared/utils';
import { ExtensionOptions, ExtensionPackageType, ExtensionType, PackageExtensionType } from '@directus/shared/types';
import { log } from '../utils/logger';
import { isLanguage, languageToShort } from '../utils/languages';
import renameMap from '../utils/rename-map';
import { Language } from '../types';
import getPackageVersion from '../utils/get-package-version';

const pkg = require('../../../../package.json');

const TEMPLATE_PATH = path.resolve(__dirname, '../../../../templates');

type CreateOptions = { language?: string };

export default async function create(type: string, name: string, options: CreateOptions): Promise<void> {
	const targetDir = name.substring(name.lastIndexOf('/') + 1);
	const targetPath = path.resolve(targetDir);

	if (!isIn(type, EXTENSION_PACKAGE_TYPES)) {
		log(
			`Extension type ${chalk.bold(type)} is not supported. Available extension types: ${EXTENSION_PACKAGE_TYPES.map(
				(t) => chalk.bold.magenta(t)
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

	if (isIn(type, PACKAGE_EXTENSION_TYPES)) {
		await createPackageExtension({ type, name, targetDir, targetPath });
	} else {
		const language = options.language ?? 'javascript';

		await createLocalExtension({ type, name, targetDir, targetPath, language });
	}
}

async function createPackageExtension({
	type,
	name,
	targetDir,
	targetPath,
}: {
	type: PackageExtensionType;
	name: string;
	targetDir: string;
	targetPath: string;
}) {
	const spinner = ora(chalk.bold('Scaffolding Directus extension...')).start();

	await fse.ensureDir(targetPath);

	const host = `^${pkg.version}`;
	const options: ExtensionOptions =
		type === 'bundle' ? { type, path: { app: 'dist/app.js', api: 'dist/api.js' }, entries: [], host } : { type, host };
	const packageManifest = getPackageManifest(name, options, await getPackageDeps(type));

	await fse.writeJSON(path.join(targetPath, 'package.json'), packageManifest, { spaces: '\t' });

	await execa('npm', ['install'], { cwd: targetPath });

	spinner.succeed(chalk.bold('Done'));

	log(getDoneMessage(type, targetDir, targetPath));
}

async function createLocalExtension({
	type,
	name,
	targetDir,
	targetPath,
	language,
}: {
	type: ExtensionType;
	name: string;
	targetDir: string;
	targetPath: string;
	language: string;
}) {
	if (!isLanguage(language)) {
		log(
			`Language ${chalk.bold(language)} is not supported. Available languages: ${EXTENSION_LANGUAGES.map((t) =>
				chalk.bold.magenta(t)
			).join(', ')}.`,
			'error'
		);
		process.exit(1);
	}

	const spinner = ora(chalk.bold('Scaffolding Directus extension...')).start();

	await fse.ensureDir(targetPath);

	await fse.copy(path.join(TEMPLATE_PATH, 'common', language), targetPath);
	await fse.copy(path.join(TEMPLATE_PATH, type, language), targetPath);
	await renameMap(targetPath, (name) => (name.startsWith('_') ? `.${name.substring(1)}` : null));

	const host = `^${pkg.version}`;
	const options: ExtensionOptions = isIn(type, HYBRID_EXTENSION_TYPES)
		? {
				type,
				path: { app: 'dist/app.js', api: 'dist/api.js' },
				source: { app: `src/app.${languageToShort(language)}`, api: `src/api.${languageToShort(language)}` },
				host,
		  }
		: {
				type,
				path: 'dist/index.js',
				source: `src/index.${languageToShort(language)}`,
				host,
		  };
	const packageManifest = getPackageManifest(name, options, await getPackageDeps(type, language));

	await fse.writeJSON(path.join(targetPath, 'package.json'), packageManifest, { spaces: '\t' });

	await execa('npm', ['install'], { cwd: targetPath });

	spinner.succeed(chalk.bold('Done'));

	log(getDoneMessage(type, targetDir, targetPath));
}

function getPackageManifest(name: string, options: ExtensionOptions, deps: Record<string, string>) {
	return {
		name: EXTENSION_NAME_REGEX.test(name) ? name : `directus-extension-${name}`,
		version: '1.0.0',
		keywords: ['directus', 'directus-extension', `directus-custom-${options.type}`],
		[EXTENSION_PKG_KEY]: options,
		scripts: {
			build: 'directus-extension build',
			dev: 'directus-extension build -w --no-minify',
		},
		devDependencies: deps,
	};
}

async function getPackageDeps(type: ExtensionPackageType, language?: Language) {
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

function getDoneMessage(type: ExtensionPackageType, targetDir: string, targetPath: string) {
	return `
Your ${type} extension has been created at ${chalk.green(targetPath)}

To start developing, run:
	${chalk.blue('cd')} ${targetDir}
	${chalk.blue('npm run')} dev

and then to build for production, run:
	${chalk.blue('npm run')} build
`;
}
