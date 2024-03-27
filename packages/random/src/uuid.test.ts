import { test, expect } from 'vitest';
import { randomUUID } from './uuid.js';

test('Returns random string', () => {
	expect(randomUUID()).toBeTypeOf('string');
});

test('Returns string in UUID format', () => {
	const uuid = randomUUID();
	const regex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

	expect(regex.test(uuid)).toBe(true);
});
