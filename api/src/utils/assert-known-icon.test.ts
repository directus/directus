import { InvalidPayloadError } from '@directus/errors';
import { expect, test } from 'vitest';
import { assertKnownIcon } from './assert-known-icon.js';

test.each([undefined, null, '', 'database', 'logo_openai', 'docker'])('accepts %j', (icon) => {
	expect(() => assertKnownIcon(icon)).not.toThrow();
});

test.each(['lorem_ipsum', 'lorem ipsum', '<details open ontoggle=alert(1)>', 42, {}])('rejects %j', (icon) => {
	expect(() => assertKnownIcon(icon)).toThrow(InvalidPayloadError);
});

test('names the field in the error', () => {
	expect(() => assertKnownIcon('lorem_ipsum', 'meta.icon')).toThrow('"meta.icon" has to be a known icon name');
});
