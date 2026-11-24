import { existsSync } from 'node:fs';
import { readlink, symlink } from 'node:fs/promises';
import path from 'node:path';
import { ExtensionManifest } from '@directus/extensions';
import { pathExists } from '@directus/utils/node';
import { readJson } from '../utils/json.js';
import { log } from '../utils/logger.js';

export default async function link(extensionsPath: string): Promise<void> {
	const extensionPath = process.cwd();

	const absoluteExtensionsPath = path.resolve(extensionsPath);

	if (!existsSync(absoluteExtensionsPath)) {
		log(`Extensions folder does not exist at ${absoluteExtensionsPath}`, 'error');
		return;
	}

	const packagePath = path.resolve('package.json');

	if (!(await pathExists(packagePath))) {
		log(`Current directory is not a valid package.`, 'error');
		return;
	}

	let manifestFile: Record<string, any>;

	try {
		manifestFile = await readJson(packagePath);
	} catch {
		log(`Current directory is not a valid Directus extension.`, 'error');
		return;
	}

	const extensionManifest = ExtensionManifest.parse(manifestFile);

	// Flatten scoped extension names so they can be detected
	const extensionName = extensionManifest.name.replaceAll('/', '-');

	if (!extensionName) {
		log(`Extension name not found in package.json`, 'error');
		return;
	}

	const type = extensionManifest['directus:extension']?.type;

	if (!type) {
		log(`Extension type not found in package.json`, 'error');
		return;
	}

	const extensionTarget = path.join(absoluteExtensionsPath, extensionName);

	try {
		const existingLink = await readlink(extensionTarget).catch(() => null);

		if (existingLink === null || path.resolve(absoluteExtensionsPath, existingLink) !== extensionPath) {
			await symlink(extensionPath, extensionTarget);
		}
	} catch (error: any) {
		log(error.message, 'error');
		log(`Try running this command with administrator privileges`, 'info');
		return;
	}

	log(`Linked ${extensionName} to ${extensionTarget}`);

	return;
}
