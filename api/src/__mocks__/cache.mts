import type { Mock } from 'vitest';
import { vi } from 'vitest';

export const getCache: Mock = vi
	.fn()
	.mockReturnValue({ cache: undefined, systemCache: undefined, lockCache: undefined });

export const flushCaches: Mock = vi.fn();
export const clearSystemCache: Mock = vi.fn();
export const setSystemCache: Mock = vi.fn();
