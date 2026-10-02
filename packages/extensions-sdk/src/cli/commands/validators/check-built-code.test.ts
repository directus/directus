import fse from 'fs-extra';
import type { Ora } from 'ora';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Report } from '../../types.js';
import checkBuiltCode from './check-built-code.js';

vi.mock('fs-extra', () => ({
	default: {
		pathExists: vi.fn(),
		readJson: vi.fn(),
	},
}));

const spinner = { text: '', fail: vi.fn() } as unknown as Ora;

beforeEach(() => {
	vi.clearAllMocks();
});

describe('check-built-code', () => {
	it('rejects when built code directory does not exist', async () => {
		vi.mocked(fse.pathExists).mockImplementation(async (p) => String(p).endsWith('package.json'));
		vi.mocked(fse.readJson).mockResolvedValue({
			'directus:extension': {
				path: 'dist/index.js',
			},
		});

		const reports: Array<Report> = [];

		await expect(checkBuiltCode.handler(spinner, reports)).rejects.toThrow('No dist/index.js directory');
	});

	it('resolves when built code directory exists', async () => {
		vi.mocked(fse.pathExists).mockResolvedValue(true as never);
		vi.mocked(fse.readJson).mockResolvedValue({});

		const reports: Array<Report> = [];

		await expect(checkBuiltCode.handler(spinner, reports)).resolves.toBe('Valid built code directory');
	});
});
