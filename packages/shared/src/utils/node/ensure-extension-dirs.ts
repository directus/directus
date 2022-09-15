import path from 'path';
import fse from 'fs-extra';
import { pluralize } from '../pluralize.js';
import type { ExtensionType } from '../../types/index.js';

export async function ensureExtensionDirs(extensionsPath: string, types: readonly ExtensionType[]): Promise<void> {
	for (const extensionType of types) {
		const dirPath = path.resolve(extensionsPath, pluralize(extensionType));
		try {
			await fse.ensureDir(dirPath);
		} catch {
			throw new Error(`Extension folder "${dirPath}" couldn't be opened`);
		}
	}
}
