import path from 'node:path';
import { pathExists } from '@directus/utils/node';
import type { Ora } from 'ora';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Report } from '../../types.js';
import { readJson } from '../../utils/json.js';
import checkBuiltCode from './check-built-code.js';

vi.mock('@directus/utils/node', () => ({
	pathExists: vi.fn(),
}));

vi.mock('../../utils/json.js', () => ({
	readJson: vi.fn(),
}));

const spinner = { text: '', fail: vi.fn() } as unknown as Ora;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('check-built-code', () => {
	test('rejects when built code directory does not exist', async () => {
		vi.mocked(pathExists).mockImplementation(async (p) => String(p).endsWith('package.json'));

		vi.mocked(readJson).mockResolvedValue({ 'directus:extension': { path: 'dist/index.js' } });

		const reports: Array<Report> = [];

		await expect(checkBuiltCode.handler(spinner, reports)).rejects.toThrow('No dist/index.js directory');
	});

	test('rejects when any bundle path does not exist', async () => {
		vi.mocked(pathExists).mockImplementation(async (p) => !String(p).endsWith('api.js'));

		vi.mocked(readJson).mockResolvedValue({
			'directus:extension': { path: { app: 'dist/app.js', api: 'dist/api.js' } },
		});

		const reports: Array<Report> = [];

		await expect(checkBuiltCode.handler(spinner, reports)).rejects.toThrow('No dist/api.js directory');

		expect(reports).toContainEqual({
			level: 'info',
			message: 'built-code: Path dist/app.js, dist/api.js found in directus:extension',
		});
	});

	test('resolves with dist relative to the project when no path is configured', async () => {
		vi.mocked(pathExists).mockResolvedValue(true as never);
		vi.mocked(readJson).mockResolvedValue({});

		const reports: Array<Report> = [];

		await expect(checkBuiltCode.handler(spinner, reports)).resolves.toBe('Valid built code directory');

		expect(pathExists).toHaveBeenLastCalledWith(path.resolve('dist'));
	});
});
