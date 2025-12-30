import { formatA2oKey } from './format-a2o-key.js';
import { expect, test } from 'vitest';

test('Joins strings with `:` character', () => {
	expect(formatA2oKey('item', 'headings')).toBe('item:headings');
});
