import path from 'path';
import { EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '@directus/constants';
import type {
	ExtensionOptions,
	ExtensionOptionsBundleEntry,
	ExtensionManifest as TExtensionManifest,
} from '@directus/extensions';
import { EXTENSION_LANGUAGES, EXTENSION_PKG_KEY, ExtensionManifest } from '@directus/extensions';
import type { NestedExtensionType } from '@directus/types';
import { isIn, isTypeIn } from '@directus/utils';
import { pathToRelativeUrl } from '@directus/utils/node';
import chalk from 'chalk';
import { execa } from 'execa';
import fse from 'fs-extra';
import inquirer from 'inquirer';
import ora from 'ora';
import type { Language } from '../types.js';
import detectJsonIndent from '../utils/detect-json-indent.js';
import getPackageManager from '../utils/get-package-manager.js';
import { getLanguageFromPath, isLanguage, languageToShort } from '../utils/languages.js';
import { log } from '../utils/logger.js';
import copyTemplate from './helpers/copy-template.js';
import getExtensionDevDeps from './helpers/get-extension-dev-deps.js';

type AddOptions = { install?: boolean };

export default async function add(options: AddOptions): Promise<void> {
	const install = options.install ?? true;
	const extensionPath = process.cwd();
	const packagePath = path.resolve('package.json');

	if (!(await fse.pathExists(packagePath))) {
		log(`Current directory is not a valid Directus extension:`, 'error');
		log(`Missing "package.json" file.`, 'error');
		process.exit(1);
	}

	let extensionManifestFile: string;

	try {
		extensionManifestFile = (await fse.readFile(packagePath, 'utf8')) as string;
	} catch {
		log(`Failed to read "package.json" file from current directory.`, 'error');
		process.exit(1);
	}

	let extensionManifest: TExtensionManifest;

	try {
		extensionManifest = JSON.parse(extensionManifestFile);
		ExtensionManifest.parse(extensionManifest);
	} catch {
		log(`Current directory is not a valid Directus extension:`, 'error');
		log(`Invalid "package.json" file.`, 'error');

		process.exit(1);
	}

	const indent = detectJsonIndent(extensionManifestFile);

	const extensionOptions = extensionManifest[EXTENSION_PKG_KEY];

	const sourceExists = await fse.pathExists(path.resolve('src'));

	if (extensionOptions.type === 'bundle') {
		const { type, name, language, alternativeSource } = await inquirer.prompt<{
			type: NestedExtensionType;
			name: string;
			language: Language;
			alternativeSource?: string;
		}>([
			{
				type: 'list',
				name: 'type',
				message: 'Choose the extension type',
				choices: () => EXTENSION_TYPES.filter((e) => e !== 'bundle'),
			},
			{
				type: 'input',
				name: 'name',
				message: 'Choose a name for the entry',
				validate: (name: string) => (name.length === 0 ? 'Entry name can not be empty.' : true),
			},
			{
				type: 'list',
				name: 'language',
				message: 'Choose the language to use',
				choices: EXTENSION_LANGUAGES,
			},
			{
				type: 'input',
				name: 'alternativeSource',
				message: 'Specify the path to the extension source',
				when: !sourceExists && extensionOptions.entries.length > 0,
			},
		]);

		const bundleEntryNames = new Set(extensionOptions.entries.map((entry) => entry.name));

		if (bundleEntryNames.has(name)) {
			log(`Extension ${chalk.bold(name)} already exists for this bundle.`, 'error');
			process.exit(1);
		}

		const spinner = ora(chalk.bold('Modifying Directus extension...')).start();

		const source = alternativeSource ?? 'src';

		const sourcePath = path.resolve(source, name);

		await fse.ensureDir(sourcePath);
		await copyTemplate(type, extensionPath, sourcePath, language);

		const newEntries: ExtensionOptionsBundleEntry[] = [
			...extensionOptions.entries,
			isIn(type, HYBRID_EXTENSION_TYPES)
				? {
						type,
						name,
						source: {
							app: `${pathToRelativeUrl(source)}/${name}/app.${languageToShort(language)}`,
							api: `${pathToRelativeUrl(source)}/${name}/api.${languageToShort(language)}`,
						},
					}
				: {
						type,
						name,
						source: `${pathToRelativeUrl(source)}/${name}/index.${languageToShort(language)}`,
					},
		];

		const newExtensionOptions: ExtensionOptions = { ...extensionOptions, entries: newEntries };

		const newExtensionManifest = {
			...extensionManifest,
			[EXTENSION_PKG_KEY]: newExtensionOptions,
			devDependencies: {
				...extensionManifest.devDependencies,
				...(await getExtensionDevDeps(
					newEntries.map((entry) => entry.type),
					getLanguageFromEntries(newEntries),
				)),
			},
		};

		await fse.writeJSON(packagePath, newExtensionManifest, { spaces: indent ?? '\t' });

		const packageManager = getPackageManager();

		if (install) {
			await execa(packageManager, ['install'], { cwd: extensionPath });
		} else {
			spinner.info(`Dependency installation skipped, to install run: ${chalk.blue(`${packageManager}`)} install`);
		}

		spinner.succeed(chalk.bold('Done'));
		log(`Your ${type} extension has been added.`);
	} else {
		const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
			{
				type: 'confirm',
				name: 'proceed',
				message: 'This will convert your extension to a bundle. Do you want to proceed?',
			},
		]);

		if (!proceed) {
			log(`Extension has not been modified.`, 'info');
			process.exit(1);
		}

		const { type, name, language, convertName } = await inquirer.prompt<{
			type: NestedExtensionType;
			name: string;
			language: Language;
			convertName: string;
		}>([
			{
				type: 'list',
				name: 'type',
				message: 'Choose the extension type',
				choices: () => EXTENSION_TYPES.filter((e) => e !== 'bundle'),
			},
			{
				type: 'input',
				name: 'name',
				message: 'Choose a name for the entry',
				validate: (name: string) => (name.length === 0 ? 'Entry name can not be empty.' : true),
			},
			{
				type: 'list',
				name: 'language',
				message: 'Choose the language to use',
				choices: EXTENSION_LANGUAGES,
			},
			{
				type: 'input',
				name: 'convertName',
				message: 'Choose a name for the extension that is converted to an entry',
				default: extensionManifest.name,
				validate: (name: string) => (name.length === 0 ? 'Entry name can not be empty.' : true),
			},
		]);

		const { extensionName, alternativeSource } = await inquirer.prompt<{
			extensionName: string;
			alternativeSource?: string;
		}>([
			{
				type: 'input',
				name: 'extensionName',
				message: 'Choose a name for the extension',
				...(convertName !== extensionManifest.name && { default: extensionManifest.name }),
				validate: (name: string) => (name.length === 0 ? 'Extension name can not be empty.' : true),
			},
			{
				type: 'input',
				name: 'alternativeSource',
				message: 'Specify the path to the extension source',
				when: !sourceExists,
			},
		]);

		const spinner = ora(chalk.bold('Modifying Directus extension...')).start();

		const source = alternativeSource ?? 'src';

		const convertSourcePath = path.resolve(source, convertName);
		const entrySourcePath = path.resolve(source, name);

		const convertFiles = (await fse.readdir(source, 'utf8')) as string[];

		await Promise.all(
			convertFiles.map((file) => fse.move(path.resolve(source, file), path.join(convertSourcePath, file))),
		);

		await fse.ensureDir(entrySourcePath);
		await copyTemplate(type, extensionPath, entrySourcePath, language);

		const toConvertSourceUrl = (entrypoint: string) =>
			path.posix.join(pathToRelativeUrl(source), convertName, path.posix.relative(source, entrypoint));

		const entries: ExtensionOptionsBundleEntry[] = [
			isTypeIn(extensionOptions, HYBRID_EXTENSION_TYPES)
				? {
						type: extensionOptions.type,
						name: convertName,
						source: {
							app: toConvertSourceUrl(extensionOptions.source.app),
							api: toConvertSourceUrl(extensionOptions.source.api),
						},
					}
				: {
						type: extensionOptions.type,
						name: convertName,
						source: toConvertSourceUrl(extensionOptions.source),
					},
			isIn(type, HYBRID_EXTENSION_TYPES)
				? {
						type,
						name,
						source: {
							app: `${pathToRelativeUrl(source)}/${name}/app.${languageToShort(language)}`,
							api: `${pathToRelativeUrl(source)}/${name}/api.${languageToShort(language)}`,
						},
					}
				: {
						type,
						name,
						source: `${pathToRelativeUrl(source)}/${name}/index.${languageToShort(language)}`,
					},
		];

		const newExtensionOptions: ExtensionOptions = {
			type: 'bundle',
			path: { app: 'dist/app.js', api: 'dist/api.js' },
			entries,
			host: extensionOptions.host,
			hidden: extensionOptions.hidden,
		};

		const newExtensionManifest = {
			...extensionManifest,
			name: extensionName,
			keywords: ['directus', 'directus-extension', 'directus-extension-bundle'],
			[EXTENSION_PKG_KEY]: newExtensionOptions,
			devDependencies: {
				...extensionManifest.devDependencies,
				...(await getExtensionDevDeps(
					entries.map((entry) => entry.type),
					getLanguageFromEntries(entries),
				)),
			},
		};

		await fse.writeJSON(packagePath, newExtensionManifest, { spaces: indent ?? '\t' });

		const packageManager = getPackageManager();

		if (install) {
			await execa(packageManager, ['install'], { cwd: extensionPath });
		} else {
			spinner.info(`Dependency installation skipped, to install run: ${chalk.blue(`${packageManager}`)} install`);
		}

		spinner.succeed(chalk.bold('Done'));
		log(`Your ${type} extension has been added.`);
	}
}

function getLanguageFromEntries(entries: ExtensionOptionsBundleEntry[]): Language[] {
	const languages = new Set<Language>();

	for (const entry of entries) {
		if (isTypeIn(entry, HYBRID_EXTENSION_TYPES)) {
			const languageApp = getLanguageFromPath(entry.source.app);
			const languageApi = getLanguageFromPath(entry.source.api);

			if (!isLanguage(languageApp)) {
				log(`App language ${chalk.bold(languageApp)} is not supported.`, 'error');
				process.exit(1);
			}

			if (!isLanguage(languageApi)) {
				log(`API language ${chalk.bold(languageApi)} is not supported.`, 'error');
				process.exit(1);
			}

			languages.add(languageApp);
			languages.add(languageApi);
		} else {
			const language = getLanguageFromPath(entry.source);

			if (!isLanguage(language)) {
				log(`Language ${chalk.bold(language)} is not supported.`, 'error');
				process.exit(1);
			}

			languages.add(language);
		}
	}

	return Array.from(languages);
}
