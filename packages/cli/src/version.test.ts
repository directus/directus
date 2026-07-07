import { describe, expect, it } from 'vitest';
import { version } from './version.js';

describe('@directus/cli', () => {
	it('exposes a semver package version so `--version` can report it', () => {
		expect(version).toMatch(/^\d+\.\d+\.\d+/);
	});
});
