import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { APP_SHARED_DEP_ALIASES, APP_SHARED_DEPS } from './shared-deps.js';

// `@tiptap/pm` does not export its package.json
const pmPackage = JSON.parse(
	readFileSync(new URL('../../../node_modules/@tiptap/pm/package.json', import.meta.url), 'utf8'),
) as { exports: Record<string, unknown>; dependencies: Record<string, string> };

const BUNDLED_SUBPATHS = ['changeset', 'inputrules'];

const sharedSubpaths = Object.keys(pmPackage.exports)
	.filter((key) => key.startsWith('./') && key !== './package.json')
	.map((key) => key.slice(2))
	.filter((subpath) => !BUNDLED_SUBPATHS.includes(subpath));

describe('richtext shared dependencies', () => {
	// a new @tiptap/pm subpath must be shared or added to BUNDLED_SUBPATHS on purpose
	test('shares every @tiptap/pm subpath except the bundled ones', () => {
		const shared = APP_SHARED_DEPS.filter((dep) => dep.startsWith('@tiptap/pm/'));

		expect(sharedSubpaths.length).toBeGreaterThan(0);
		expect([...shared].sort()).toEqual(sharedSubpaths.map((subpath) => `@tiptap/pm/${subpath}`).sort());
	});

	test('aliases the prosemirror package behind each shared subpath', () => {
		const expected = Object.keys(pmPackage.dependencies).filter(
			(name) => !BUNDLED_SUBPATHS.some((subpath) => name === `prosemirror-${subpath}`),
		);

		expect(Object.keys(APP_SHARED_DEP_ALIASES).sort()).toEqual(expected.sort());
	});
});
