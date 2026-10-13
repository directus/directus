import { describe, expect, test, vi } from 'vitest';
import getExtensionDevDeps from './get-extension-dev-deps.js';

vi.mock('../../utils/get-package-version.js', () => ({
	default: vi.fn(async (name: string) => `${name}-version`),
}));

vi.mock('../../utils/get-sdk-version.js', () => ({
	default: () => 'sdk-version',
}));

describe('getExtensionDevDeps', () => {
	test('adds Tiptap for a richtext extension', async () => {
		const deps = await getExtensionDevDeps('richtext', 'javascript');

		expect(deps).toEqual({
			'@directus/extensions-sdk': 'sdk-version',
			vue: '^vue-version',
			'@tiptap/core': '^@tiptap/core-version',
			'@tiptap/pm': '^@tiptap/pm-version',
		});
	});

	test('adds Tiptap when a bundle contains a richtext entry', async () => {
		const deps = await getExtensionDevDeps(['interface', 'richtext'], ['typescript']);

		expect(deps).toHaveProperty('@tiptap/core');
		expect(deps).toHaveProperty('@tiptap/pm');
	});

	test('does not add Tiptap for other app extensions', async () => {
		const deps = await getExtensionDevDeps('interface', 'typescript');

		expect(deps).not.toHaveProperty('@tiptap/core');
		expect(deps).not.toHaveProperty('@tiptap/pm');
	});
});
