import { vi } from 'vitest';
export const getCache = vi.fn().mockReturnValue({ cache: undefined, systemCache: undefined, lockCache: undefined });
export const flushCaches = vi.fn();
export const clearSystemCache = vi.fn();
export const setSystemCache = vi.fn();
