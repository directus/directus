import { createHash, type Hash } from 'node:crypto';
import { hostname } from 'node:os';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { _cache, processId } from './process-id.js';

vi.mock('node:crypto');
vi.mock('node:os');

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	_cache.id = undefined;
	vi.useRealTimers();
});

test('Returns cached value if exists', () => {
	const val = 'test-value';
	_cache.id = val;
	expect(processId()).toBe(val);
});

test('Generates and returns hash if value does not exist yet', () => {
	const mockHash = { update: vi.fn().mockReturnThis(), digest: vi.fn() } as unknown as Hash;
	vi.mocked(createHash).mockReturnValue(mockHash);
	vi.mocked(hostname).mockReturnValue('test-hostname');
	vi.setSystemTime(new Date('2023-11-14T22:13:20Z'));

	processId();

	expect(createHash).toHaveBeenCalledWith('md5');
	expect(hostname).toHaveBeenCalled();
	expect(mockHash.update).toHaveBeenCalledWith(`test-hostname${process.pid}1700000000000`);
});
