import { NESTED_EXTENSION_TYPES } from '../../shared/constants/index.js';
import type { DirResult } from 'tmp';
import { dirSync } from 'tmp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ensureExtensionDirs } from './ensure-extension-dirs.js';

describe('ensureExtensionDirs', () => {
	let rootDir: DirResult;

	beforeEach(() => {
		rootDir = dirSync({ unsafeCleanup: true });
	});

	afterEach(() => {
		rootDir.removeCallback();
	});

	it('returns undefined if the folders exist', async () => {
		expect(await ensureExtensionDirs(rootDir.name, NESTED_EXTENSION_TYPES)).toBe(undefined);
	});

	it('throws an error when a folder can not be opened', () => {
		expect(async () => {
			await ensureExtensionDirs('/.', NESTED_EXTENSION_TYPES);
		}).rejects.toThrow(`Extension folder "/interfaces" couldn't be opened`);
	});
});
