import path from 'path';
import fse from 'fs-extra';
import { pluralize } from '../browser';
import { EXTENSION_TYPES } from '../../constants';

export async function ensureExtensionDirs(extensionsPath: string): Promise<void> {
	for (const extensionType of EXTENSION_TYPES) {
		const dirPath = path.resolve(extensionsPath, pluralize(extensionType));
		try {
			await fse.ensureDir(dirPath);
		} catch {
			throw new Error(`Extension folder "${dirPath}" couldn't be opened`);
		}
	}
}
