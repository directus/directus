import { afterEach, expect, test, vi } from 'vitest';
import type { Env } from '../types/env.js';
import { createEnv } from './create-env.js';
import { _cache, useEnv } from './use-env.js';

vi.mock('./create-env.js');

afterEach(() => {
	vi.resetAllMocks();

	_cache.env = undefined;
});

test('Returns cached env if exists', () => {
	_cache.env = {} as Env;

	const env = useEnv();

	expect(env).toBe(_cache.env);
});

test('Creates new cached env if not exists', () => {
	const mockEnv = {} as Env;
	vi.mocked(createEnv).mockReturnValue(mockEnv);

	const env = useEnv();

	expect(env).toBe(mockEnv);
	expect(_cache.env).toBe(mockEnv);
});
