import path from 'path';
import fse from 'fs-extra';
import { pluralize } from './pluralize';
import { EXTENSION_TYPES } from '../constants';

export async function ensureExtensionDirs(extensionsPath: string): Promise<void> {
	for (const extensionType of EXTENSION_TYPES) {
		const dirPath = path.resolve(extensionsPath, pluralize(extensionType));
		await fse.ensureDir(dirPath);
	}
}
