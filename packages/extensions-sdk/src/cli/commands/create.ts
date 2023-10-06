import type {
	ApiExtensionType,
	AppExtensionType,
	BundleExtensionType,
	ExtensionOptions,
	ExtensionType,
	HybridExtensionType,
} from '@directus/extensions';
import {
	BUNDLE_EXTENSION_TYPES,
	EXTENSION_LANGUAGES,
	EXTENSION_NAME_REGEX,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
} from '@directus/extensions';
import { isIn } from '@directus/utils';
import chalk from 'chalk';
import { execa } from 'execa';
import fse from 'fs-extra';
import ora from 'ora';
import path from 'path';
import getPackageManager from '../utils/get-package-manager.js';
import getSdkVersion from '../utils/get-sdk-version.js';
import { isLanguage, languageToShort } from '../utils/languages.js';
import { log } from '../utils/logger.js';
import copyTemplate from './helpers/copy-template.js';
import getExtensionDevDeps from './helpers/get-extension-dev-deps.js';

type CreateOptions = { language?: string };

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

	if (isIn(type, BUNDLE_EXTENSION_TYPES)) {
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
	type: BundleExtensionType;
	name: string;
	targetDir: string;
	targetPath: string;
}) {
	const spinner = ora(chalk.bold('Scaffolding Directus extension...')).start();

	await fse.ensureDir(targetPath);
	await copyTemplate(type, targetPath);

	const host = `^${getSdkVersion()}`;
	const options = { type, path: { app: 'dist/app.js', api: 'dist/api.js' }, entries: [], host };
	const packageManifest = getPackageManifest(name, options, await getExtensionDevDeps(type));

	await fse.writeJSON(path.join(targetPath, 'package.json'), packageManifest, { spaces: '\t' });

	const packageManager = getPackageManager();

	await execa(packageManager, ['install'], { cwd: targetPath });

	spinner.succeed(chalk.bold('Done'));

	log(getDoneMessage(type, targetDir, targetPath, packageManager));
}

async function createLocalExtension({
	type,
	name,
	targetDir,
	targetPath,
	language,
}: {
	type: AppExtensionType | ApiExtensionType | HybridExtensionType;
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
	await copyTemplate(type, targetPath, 'src', language);

	const host = `^${getSdkVersion()}`;

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

	const packageManifest = getPackageManifest(name, options, await getExtensionDevDeps(type, language));

	await fse.writeJSON(path.join(targetPath, 'package.json'), packageManifest, { spaces: '\t' });

	const packageManager = getPackageManager();

	await execa(packageManager, ['install'], { cwd: targetPath });

	spinner.succeed(chalk.bold('Done'));

	log(getDoneMessage(type, targetDir, targetPath, packageManager));
}

function getPackageManifest(name: string, options: ExtensionOptions, deps: Record<string, string>) {
	const packageManifest: Record<string, any> = {
		name: EXTENSION_NAME_REGEX.test(name) ? name : `directus-extension-${name}`,
		description: 'Please enter a description for your extension',
		icon: 'extension',
		version: '1.0.0',
		keywords: ['directus', 'directus-extension', `directus-custom-${options.type}`],
		type: 'module',
		[EXTENSION_PKG_KEY]: options,
		scripts: {
			build: 'directus-extension build',
			dev: 'directus-extension build -w --no-minify',
			link: 'directus-extension link',
		},
		devDependencies: deps,
	};

	if (options.type === 'bundle') {
		packageManifest['scripts']['add'] = 'directus-extension add';
	}

	return packageManifest;
}

function getDoneMessage(type: ExtensionType, targetDir: string, targetPath: string, packageManager: string) {
	return `
Your ${type} extension has been created at ${chalk.green(targetPath)}

To start developing, run:
	${chalk.blue('cd')} ${targetDir}
	${chalk.blue(`${packageManager} run`)} dev

and then to build for production, run:
	${chalk.blue(`${packageManager} run`)} build
`;
}
