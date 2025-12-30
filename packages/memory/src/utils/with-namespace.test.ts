import { withNamespace } from './with-namespace.js';
import { expect, test } from 'vitest';

test('Prepends given key with given namespace', () => {
	expect(withNamespace('key', 'namespace')).toBe('namespace:key');
});
