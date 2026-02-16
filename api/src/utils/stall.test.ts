import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stall } from './stall.js';

describe('stall', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('resolves immediately when elapsed time exceeds stall time', async () => {
		const stallTime = 100;
		const start = performance.now() - 150; // Simulate 150ms already elapsed

		const promise = stall(stallTime, start);

		// Should resolve immediately without needing timer advancement
		await expect(promise).resolves.toBeUndefined();
	});

	it('resolves immediately when elapsed time equals stall time', async () => {
		const stallTime = 100;
		const start = performance.now() - 100; // Exactly 100ms elapsed

		const promise = stall(stallTime, start);

		await expect(promise).resolves.toBeUndefined();
	});

	it('waits for remaining time when elapsed time is less than stall time', async () => {
		const stallTime = 100;
		const start = performance.now() - 30; // Only 30ms elapsed, need 70ms more

		const promise = stall(stallTime, start);

		vi.advanceTimersByTime(70);

		await expect(promise).resolves.toBeUndefined();
	});

	it('waits for full stall time when starting immediately', async () => {
		const stallTime = 100;
		const start = performance.now();

		const promise = stall(stallTime, start);

		// Advance timers by full stall time
		vi.advanceTimersByTime(100);

		await expect(promise).resolves.toBeUndefined();
	});

	it('handles zero stall time', async () => {
		const start = performance.now();

		const promise = stall(0, start);

		await expect(promise).resolves.toBeUndefined();
	});

	it('handles negative remaining time gracefully', async () => {
		const stallTime = 50;
		const start = performance.now() - 200; // Way more than stall time elapsed

		const promise = stall(stallTime, start);

		await expect(promise).resolves.toBeUndefined();
	});
});
