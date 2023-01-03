import path from 'path';
import fs from 'fs-extra';
import { log } from '../utils/logger';
import { ExtensionManifest } from '@directus/shared/types';

export default async function link(extensionsPath: string): Promise<void> {
	const extensionPath = process.cwd();

	const absoluteExtensionsPath = path.resolve(extensionsPath);

	if (!fs.existsSync(absoluteExtensionsPath)) {
		log(`Extensions folder does not exist at ${absoluteExtensionsPath}`, 'error');
		return;
	}

	const packagePath = path.resolve('package.json');

	if (!(await fs.pathExists(packagePath))) {
		log(`Current directory is not a valid package.`, 'error');
		return;
	}

	let extensionManifest: ExtensionManifest;

	try {
		extensionManifest = ExtensionManifest.parse(fs.readJSON(packagePath));
	} catch (err) {
		log(`Current directory is not a valid Directus extension.`, 'error');
		return;
	}

	const extensionName = extensionManifest.name;

	if (!extensionName) {
		log(`Extension name not found in package.json`, 'error');
		return;
	}

	const type = extensionManifest['directus:extension']?.type;
	let extensionTarget;

	if (!type) {
		log(`Extension type not found in package.json`, 'error');
		return;
	}

	if (type === 'bundle') {
		extensionTarget = path.join(absoluteExtensionsPath, 'bundles', extensionName);

		try {
			fs.ensureSymlinkSync(extensionPath, extensionTarget);
		} catch (error: any) {
			log(error.message, 'error');
			log(`Try running this command with administrator privileges`, 'info');
			return;
		}
	} else {
		extensionTarget = path.join(absoluteExtensionsPath, type + 's', extensionName);

		try {
			fs.ensureSymlinkSync(path.join(extensionPath, 'dist'), extensionTarget);
		} catch (error: any) {
			log(error.message, 'error');
			log(`Try running this command with administrator privileges`, 'info');
			return;
		}
	}

	log(`Linked ${extensionName} to ${extensionTarget}`);

	return;
}
