import { test, expect } from 'vitest';
import { from } from './from.js';

test('Returns parameterized FROM with escaped identifier', () => {
	expect(from('test')).toStrictEqual('FROM "test"');
});
