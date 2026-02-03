import path from 'path';
import { BUNDLE_EXTENSION_TYPES, EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '@directus/constants';
import type { ExtensionOptions } from '@directus/extensions';
import { EXTENSION_LANGUAGES, EXTENSION_PKG_KEY } from '@directus/extensions';
import type {
	ApiExtensionType,
	AppExtensionType,
	BundleExtensionType,
	ExtensionType,
	HybridExtensionType,
} from '@directus/types';
import { isIn } from '@directus/utils';
import chalk from 'chalk';
import { execa } from 'execa';
import fse from 'fs-extra';
import ora from 'ora';
import { LAST_BREAKING_RELEASE } from '../../constants/last-breaking.js';
import getPackageManager from '../utils/get-package-manager.js';
import { isLanguage, languageToShort } from '../utils/languages.js';
import { log } from '../utils/logger.js';
import copyTemplate from './helpers/copy-template.js';
import getExtensionDevDeps from './helpers/get-extension-dev-deps.js';

type CreateOptions = {
	language?: string;
	install?: boolean;
};

export default async function create(type: string, name: string, options: CreateOptions): Promise<void> {
	const install = options.install ?? true;
	const targetDir = name.substring(name.lastIndexOf('/') + 1);
	const targetPath = path.resolve(targetDir);

	if (!isIn(type, EXTENSION_TYPES)) {
		log(
			`Extension type ${chalk.bold(type)} is not supported. Available extension types: ${EXTENSION_TYPES.map((t) =>
				chalk.bold.magenta(t),
			).join(', ')}.`,
			'error',
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
		await createBundleExtension({ type, name, targetDir, targetPath, install });
	} else {
		const language = options.language ?? 'javascript';

		await createExtension({ type, name, targetDir, targetPath, language, install });
	}
}

async function createBundleExtension({
	type,
	name,
	targetDir,
	targetPath,
	install,
}: {
	type: BundleExtensionType;
	name: string;
	targetDir: string;
	targetPath: string;
	install: boolean;
}) {
	const spinner = ora(chalk.bold('Scaffolding Directus extension...')).start();

	await fse.ensureDir(targetPath);
	await copyTemplate(type, targetPath);

	const host = `^${LAST_BREAKING_RELEASE}`;
	const options = { type, path: { app: 'dist/app.js', api: 'dist/api.js' }, entries: [], host };
	const packageManifest = getPackageManifest(name, options, await getExtensionDevDeps(type));

	await fse.writeJSON(path.join(targetPath, 'package.json'), packageManifest, { spaces: '\t' });

	const packageManager = getPackageManager();

	if (install) {
		await execa(packageManager, ['install'], { cwd: targetPath });
	}

	spinner.succeed(chalk.bold('Done'));

	log(getDoneMessage(type, targetDir, targetPath, packageManager, install));
}

async function createExtension({
	type,
	name,
	targetDir,
	targetPath,
	language,
	install,
}: {
	type: AppExtensionType | ApiExtensionType | HybridExtensionType;
	name: string;
	targetDir: string;
	targetPath: string;
	language: string;
	install: boolean;
}) {
	if (!isLanguage(language)) {
		log(
			`Language ${chalk.bold(language)} is not supported. Available languages: ${EXTENSION_LANGUAGES.map((t) =>
				chalk.bold.magenta(t),
			).join(', ')}.`,
			'error',
		);

		process.exit(1);
	}

	const spinner = ora(chalk.bold('Scaffolding Directus extension...')).start();

	await fse.ensureDir(targetPath);
	await copyTemplate(type, targetPath, 'src', language);

	const host = `^${LAST_BREAKING_RELEASE}`;

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

	if (install) {
		await execa(packageManager, ['install'], { cwd: targetPath });
	}

	spinner.succeed(chalk.bold('Done'));

	log(getDoneMessage(type, targetDir, targetPath, packageManager, install));
}

function getPackageManifest(name: string, options: ExtensionOptions, deps: Record<string, string>) {
	const packageManifest: Record<string, any> = {
		name: name,
		description: 'Please enter a description for your extension',
		icon: 'extension',
		version: '1.0.0',
		keywords: ['directus', 'directus-extension', `directus-extension-${options.type}`],
		type: 'module',
		files: ['dist'],
		[EXTENSION_PKG_KEY]: options,
		scripts: {
			build: 'directus-extension build',
			dev: 'directus-extension build -w --no-minify',
			link: 'directus-extension link',
			validate: 'directus-extension validate',
		},
		devDependencies: deps,
	};

	if (options.type === 'bundle') {
		packageManifest['scripts']['add'] = 'directus-extension add';
	}

	return packageManifest;
}

function getDoneMessage(
	type: ExtensionType,
	targetDir: string,
	targetPath: string,
	packageManager: string,
	install: boolean,
) {
	let message = `
Your ${type} extension has been created at ${chalk.green(targetPath)}

To start developing, run:
	${chalk.blue('cd')} ${targetDir}`;

	if (!install) {
		message += `
	${chalk.blue(`${packageManager}`)} install`;
	}

	message += `
	${chalk.blue(`${packageManager} run`)} dev

To build for production, run:
	${chalk.blue(`${packageManager} run`)} build
`;

	return message;
}
