import path from 'path';
import fse from 'fs-extra';
import getTemplatePath from '../../utils/get-template-path';
import renameMap from '../../utils/rename-map';
import { ExtensionPackageType } from '@directus/shared/types';
import { Language } from '../../types';

async function copyIfExists(src: string, dest: string): Promise<void> {
	if (await fse.pathExists(src)) {
		await fse.copy(src, dest, { overwrite: false });
	}
}

async function copyLanguageTemplate(templateLanguagePath: string, targetPath: string, sourcePath?: string) {
	await copyIfExists(path.join(templateLanguagePath, 'config'), targetPath);

	if (sourcePath) {
		await copyIfExists(path.join(templateLanguagePath, 'source'), path.resolve(targetPath, sourcePath));
	}
}

async function copyTypeTemplate(
	templateTypePath: string,
	targetPath: string,
	sourcePath?: string,
	language?: Language
) {
	await copyLanguageTemplate(path.join(templateTypePath, 'common'), targetPath, sourcePath);

	if (language) {
		await copyLanguageTemplate(path.join(templateTypePath, language), targetPath, sourcePath);
	}
}

export default async function copyTemplate(
	type: ExtensionPackageType,
	targetPath: string,
	sourcePath?: string,
	language?: Language
): Promise<void> {
	const templatePath = getTemplatePath();

	await copyTypeTemplate(path.join(templatePath, 'common'), targetPath, sourcePath, language);
	await copyTypeTemplate(path.join(templatePath, type), targetPath, sourcePath, language);

	await renameMap(targetPath, (name) => (name.startsWith('_') ? `.${name.substring(1)}` : null));
}
