import { describe, expect, test } from 'vitest';
import { collectFilesConfig } from './files.js';

describe('collectFilesConfig', () => {
	test('returns null for unset sizes', () => {
		expect(collectFilesConfig({})).toStrictEqual({ max_upload_size: null, import_max_file_size: null });
	});

	test('reads configured sizes', () => {
		expect(collectFilesConfig({ FILES_MAX_UPLOAD_SIZE: '100mb', IMPORT_MAX_FILE_SIZE: '50mb' })).toStrictEqual({
			max_upload_size: '100mb',
			import_max_file_size: '50mb',
		});
	});
});
