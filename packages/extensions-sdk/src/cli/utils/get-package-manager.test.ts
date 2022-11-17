import { vi, afterEach, expect, test } from 'vitest';
import getPackageManagerAgent from './get-package-manager-agent';
import getPackageManager from './get-package-manager';

vi.mock('./get-package-manager-agent');

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns npm is agent data is unavailable', () => {
	vi.mocked(getPackageManagerAgent).mockReturnValueOnce(null);
	expect(getPackageManager()).toBe('npm');
});

test('Returns pnpm if pnpm exists in agent and is not ?', () => {
	vi.mocked(getPackageManagerAgent).mockReturnValueOnce({
		node: 'v18.12.1',
		npm: '?',
		os: 'darwin (arm64)',
		pnpm: '7.16.0',
	});

	expect(getPackageManager()).toBe('pnpm');
});

test('Returns yarn if yarn exists in agent and is not ?', () => {
	vi.mocked(getPackageManagerAgent).mockReturnValueOnce({
		node: 'v18.12.1',
		npm: '?',
		os: 'darwin (arm64)',
		yarn: '2',
	});

	expect(getPackageManager()).toBe('yarn');
});

test('Returns npm is neither pnpm or yarn exist', () => {
	vi.mocked(getPackageManagerAgent).mockReturnValueOnce({
		node: 'v18.12.1',
		npm: '8.19.2',
		os: 'darwin (arm64)',
	});

	expect(getPackageManager()).toBe('npm');
});
