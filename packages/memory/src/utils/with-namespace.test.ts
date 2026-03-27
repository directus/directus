import { expect, test } from 'vite-plus/test';
import { withNamespace } from './with-namespace.js';

test('Prepends given key with given namespace', () => {
	expect(withNamespace('key', 'namespace')).toBe('namespace:key');
});
