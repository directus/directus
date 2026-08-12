import fse from 'fs-extra';
import type { Ora } from 'ora';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Report } from '../../types.js';
import checkDirectusConfig from './check-directus-config.js';

vi.mock('fs-extra', () => ({
	default: {
		pathExists: vi.fn(),
		readJson: vi.fn(),
	},
}));

const spinner = { text: '', fail: vi.fn() } as unknown as Ora;

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(fse.pathExists).mockResolvedValue(true as never);
});

describe('check-directus-config', () => {
	// Previously crashed with a TypeError from API_EXTENSION_TYPES.findIndex(type)
	it('warns instead of crashing for an API extension with a disabled sandbox', async () => {
		vi.mocked(fse.readJson).mockResolvedValue({
			'directus:extension': {
				type: 'endpoint',
				path: 'dist/index.js',
				source: 'src/index.ts',
				host: '^11.0.0',
				sandbox: { enabled: false },
			},
		});

		const reports: Array<Report> = [];

		await expect(checkDirectusConfig.handler(spinner, reports)).resolves.toBe('Valid directus:extension Object');

		expect(reports).toContainEqual({
			level: 'warn',
			message: `directus-config: Extension won't be generally visible in the Directus Marketplace`,
		});
	});

	it('does not warn for an API extension with an enabled sandbox', async () => {
		vi.mocked(fse.readJson).mockResolvedValue({
			'directus:extension': {
				type: 'endpoint',
				path: 'dist/index.js',
				source: 'src/index.ts',
				host: '^11.0.0',
				sandbox: { enabled: true, requestedScopes: {} },
			},
		});

		const reports: Array<Report> = [];

		await expect(checkDirectusConfig.handler(spinner, reports)).resolves.toBe('Valid directus:extension Object');

		expect(reports.filter((report) => report.level === 'warn')).toEqual([]);
	});
});
