import validate from 'validate-npm-package-name';
import { afterEach, expect, test, vi } from 'vitest';
import { validateName } from './validate-name.js';

vi.mock('validate-npm-package-name');

afterEach(() => {
	vi.resetAllMocks();
});

test('Throws an error when validate is false', () => {
	vi.mocked(validate).mockReturnValue({
		validForNewPackages: false,
		validForOldPackages: true,
		errors: ['test-a', 'test-b'],
		warnings: [],
	});

	expect(() => validateName('fake')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Extension name is not a valid npm package name: test-a, test-b]`,
	);
});

test('Does not throw for valid package names', () => {
	vi.mocked(validate).mockReturnValue({
		validForNewPackages: true,
		validForOldPackages: true,
		errors: [],
		warnings: [],
	});

	expect(() => validateName('real')).not.toThrow();
});
