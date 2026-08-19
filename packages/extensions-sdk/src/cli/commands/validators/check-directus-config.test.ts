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

const mockConfig = (sandbox: unknown) => {
	vi.mocked(fse.readJson).mockResolvedValue({
		'directus:extension': {
			type: 'endpoint',
			path: 'dist/index.js',
			source: 'src/index.ts',
			host: '^11.0.0',
			sandbox,
		},
	});
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(fse.pathExists).mockResolvedValue(true as never);
});

describe('check-directus-config', () => {
	it.each([
		{ description: 'a disabled sandbox', sandbox: { enabled: false } },
		{ description: 'an empty sandbox object', sandbox: {} },
		{ description: 'requested scopes but no enabled flag', sandbox: { requestedScopes: { log: {} } } },
		{ description: 'no sandbox at all', sandbox: undefined },
	])('warns for an API extension with $description', async ({ sandbox }) => {
		mockConfig(sandbox);

		const reports: Array<Report> = [];

		await expect(checkDirectusConfig.handler(spinner, reports)).resolves.toBe('Valid directus:extension Object');

		expect(reports).toContainEqual({
			level: 'warn',
			message: `directus-config: Extension won't be generally visible in the Directus Marketplace`,
		});
	});

	it('does not warn for an API extension with an enabled sandbox', async () => {
		mockConfig({ enabled: true, requestedScopes: {} });

		const reports: Array<Report> = [];

		await expect(checkDirectusConfig.handler(spinner, reports)).resolves.toBe('Valid directus:extension Object');

		expect(reports.filter((report) => report.level === 'warn')).toEqual([]);
	});
});
