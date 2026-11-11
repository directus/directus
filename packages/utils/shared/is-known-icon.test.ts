import { expect, test } from 'vitest';
import { isKnownIcon } from './is-known-icon.js';

test.each(['close', 'database', 'grid_1', 'logo_openai', 'docker'])('accepts the known icon "%s"', (name) => {
	expect(isKnownIcon(name)).toBe(true);
});

test.each(['', 'lorem_ipsum', 'lorem ipsum', 'Close', '<details open ontoggle=alert(1)>'])(
	'rejects the unknown icon "%s"',
	(name) => {
		expect(isKnownIcon(name)).toBe(false);
	},
);
