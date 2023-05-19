import { test, expect } from 'vitest';
import { createError } from './create-error.js';

test('Returns enhanced error object', () => {
	const testErr = createError('TEST');
})
