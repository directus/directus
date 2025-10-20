import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEnv } from '@directus/env';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

// without this import the first test doing this import gets a ~700ms time penalty
// resulting in that test getting unfairly flagged as a "slow test"
await import('./rate-limiter.js');

describe('Email Rate Limiter', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe('useEmailRateLimiterQueue', () => {
		test('should resolve to undefined when rate limiter is not enabled', async () => {
			vi.mocked(useEnv).mockReturnValue({
				EMAIL_LIMITER_ENABLED: 'false',
			});

			// dynamic import because useEnv is accessed in the file root
			const { useEmailRateLimiterQueue } = await import('./rate-limiter.js');
			
			await expect(useEmailRateLimiterQueue()).resolves.toBeUndefined();
		});
		
		test('should be able to consume all points without error', async () => {
			vi.mocked(useEnv).mockReturnValue({
				EMAIL_LIMITER_ENABLED: 'true',
				EMAIL_LIMITER_POINTS: 3,
				EMAIL_LIMITER_DURATION: 10,
				EMAIL_LIMITER_QUEUE_SIZE: 0,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useEmailRateLimiterQueue } = await import('./rate-limiter.js');

			// consume 3 points
			await expect(Promise.all([
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
			])).resolves.not.toThrowError();
		});
		
		test('should throw an error after all points have been consumed', async () => {
			vi.mocked(useEnv).mockReturnValue({
				EMAIL_LIMITER_ENABLED: 'true',
				EMAIL_LIMITER_POINTS: 3,
				EMAIL_LIMITER_DURATION: 10,
				EMAIL_LIMITER_QUEUE_SIZE: 0,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useEmailRateLimiterQueue } = await import('./rate-limiter.js');

			// consume 4 points
			await expect(Promise.all([
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
			])).rejects.toThrowError(/^Email sending limit exceeded\./);
		});
		
		test('should be able to fill the queue without error', async () => {
			vi.mocked(useEnv).mockReturnValue({
				EMAIL_LIMITER_ENABLED: 'true',
				EMAIL_LIMITER_POINTS: 1,
				EMAIL_LIMITER_DURATION: 0.02, // 20ms keep this low for test speed
				EMAIL_LIMITER_QUEUE_SIZE: 2,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useEmailRateLimiterQueue } = await import('./rate-limiter.js');

			// consume 1 point and fill the queue
			await expect(Promise.all([
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
			])).resolves.not.toThrowError();
		});
		
		test('should throw an error after the queue is full', async () => {
			vi.mocked(useEnv).mockReturnValue({
				EMAIL_LIMITER_ENABLED: 'true',
				EMAIL_LIMITER_POINTS: 1,
				EMAIL_LIMITER_DURATION: 1,
				EMAIL_LIMITER_QUEUE_SIZE: 2,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useEmailRateLimiterQueue } = await import('./rate-limiter.js');

			// consume 1 point and overflow the queue
			await expect(Promise.all([
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
			])).rejects.toThrowError(/^Email sending limit exceeded\./);
		});
		
		test('should include a custom message in the error', async () => {
			vi.mocked(useEnv).mockReturnValue({
				EMAIL_LIMITER_ENABLED: 'true',
				EMAIL_LIMITER_POINTS: 1,
				EMAIL_LIMITER_DURATION: 1,
				EMAIL_LIMITER_QUEUE_SIZE: 0,
				EMAIL_LIMITER_ERROR_MESSAGE: 'My custom message.'
			});

			// dynamic import because useEnv is accessed in the file root
			const { useEmailRateLimiterQueue } = await import('./rate-limiter.js');

			// consume 2 points
			await expect(Promise.all([
				useEmailRateLimiterQueue(),
				useEmailRateLimiterQueue(),
			])).rejects.toThrowError(/^Email sending limit exceeded\..*My custom message\.$/);
		});
	});
});
