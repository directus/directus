import { cp, readdir } from 'node:fs/promises';
import path from 'path';
import type { ExtensionType } from '@directus/types';
import { pathExists } from '@directus/utils/node';
import type { Language } from '../../types.js';
import getTemplatePath from '../../utils/get-template-path.js';

type TemplateFile = { type: 'config' | 'source'; path: string };

async function copyTemplateFile(templateFile: TemplateFile, extensionPath: string, sourcePath?: string) {
	if (sourcePath !== undefined) {
		const oldName = path.basename(templateFile.path);
		const newName = oldName.startsWith('_') ? `.${oldName.substring(1)}` : oldName;

		const targetPath =
			templateFile.type === 'config'
				? path.join(extensionPath, newName)
				: path.resolve(extensionPath, sourcePath, newName);

		await cp(templateFile.path, targetPath, { recursive: true, force: false });
	}
}

async function getFilesInDir(templatePath: string): Promise<string[]> {
	if (!(await pathExists(templatePath))) return [];

	const files = await readdir(templatePath);

	return files.map((file) => path.join(templatePath, file));
}

async function getLanguageTemplateFiles(templateLanguagePath: string): Promise<TemplateFile[]> {
	const [configFiles, sourceFiles] = await Promise.all([
		getFilesInDir(path.join(templateLanguagePath, 'config')),
		getFilesInDir(path.join(templateLanguagePath, 'source')),
	]);

	const configTemplateFiles: TemplateFile[] = configFiles.map((file) => ({ type: 'config', path: file }));
	const sourceTemplateFiles: TemplateFile[] = sourceFiles.map((file) => ({ type: 'source', path: file }));

	return [...configTemplateFiles, ...sourceTemplateFiles];
}

async function getTypeTemplateFiles(templateTypePath: string, language?: Language): Promise<TemplateFile[]> {
	const [commonTemplateFiles, languageTemplateFiles] = await Promise.all([
		getLanguageTemplateFiles(path.join(templateTypePath, 'common')),
		language ? getLanguageTemplateFiles(path.join(templateTypePath, language)) : null,
	]);

	return [...commonTemplateFiles, ...(languageTemplateFiles ? languageTemplateFiles : [])];
}

async function getTemplateFiles(type: ExtensionType, language?: Language): Promise<TemplateFile[]> {
	const templatePath = getTemplatePath();

	const [commonTemplateFiles, typeTemplateFiles] = await Promise.all([
		getTypeTemplateFiles(path.join(templatePath, 'common'), language),
		getTypeTemplateFiles(path.join(templatePath, type), language),
	]);

	return [...commonTemplateFiles, ...typeTemplateFiles];
}

export default async function copyTemplate(
	type: ExtensionType,
	extensionPath: string,
	sourcePath?: string,
	language?: Language,
): Promise<void> {
	const templateFiles = await getTemplateFiles(type, language);

	await Promise.all(templateFiles.map((templateFile) => copyTemplateFile(templateFile, extensionPath, sourcePath)));
}
