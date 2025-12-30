import { getFileExtension } from './get-file-extension.js';
import { extname } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('node:path');

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns lowercased extname without period prefix', () => {
	vi.mocked(extname).mockReturnValue('.JPEG');
	const res = getFileExtension('./my-test-file.JPEG');
	expect(extname).toHaveBeenCalledWith('./my-test-file.JPEG');
	expect(res).toBe('jpeg');
});
