import { useEnv } from '@directus/env';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

// without this import the first test doing this import gets a ~700ms time penalty
// resulting in that test getting unfairly flagged as a "slow test"
await import('./rate-limiter.js');

describe('Flows Email Operation Rate Limiter', () => {
	const TEST_FLOW_ID_1 = '75f246b0-d48d-4644-afb8-52785bef01d1';
	const TEST_FLOW_ID_2 = '444d478f-62f9-4a48-9ab6-58a201cbcd0c';

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe('useFlowsEmailRateLimiter', () => {
		test('should resolve to undefined when rate limiter is not enabled', async () => {
			vi.mocked(useEnv).mockReturnValue({
				RATE_LIMITER_EMAIL_FLOWS_ENABLED: 'false',
			});

			// dynamic import because useEnv is accessed in the file root
			const { useFlowsEmailRateLimiter } = await import('./rate-limiter.js');

			await expect(useFlowsEmailRateLimiter(TEST_FLOW_ID_1)).resolves.toBeUndefined();
		});

		test('should be able to consume all points without error', async () => {
			vi.mocked(useEnv).mockReturnValue({
				RATE_LIMITER_EMAIL_FLOWS_ENABLED: 'true',
				RATE_LIMITER_EMAIL_FLOWS_POINTS: 3,
				RATE_LIMITER_EMAIL_FLOWS_DURATION: 10,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useFlowsEmailRateLimiter } = await import('./rate-limiter.js');

			// consume 3 points
			await expect(
				Promise.all([
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
				]),
			).resolves.not.toThrowError();
		});

		test('should throw an error after all points have been consumed', async () => {
			vi.mocked(useEnv).mockReturnValue({
				RATE_LIMITER_EMAIL_FLOWS_ENABLED: 'true',
				RATE_LIMITER_EMAIL_FLOWS_POINTS: 3,
				RATE_LIMITER_EMAIL_FLOWS_DURATION: 10,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useFlowsEmailRateLimiter } = await import('./rate-limiter.js');

			// consume 4 points
			await expect(
				Promise.all([
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
				]),
			).rejects.toThrowError(/^Email sending limit exceeded\./);
		});

		test('should include a custom message in the error', async () => {
			vi.mocked(useEnv).mockReturnValue({
				RATE_LIMITER_EMAIL_FLOWS_ENABLED: 'true',
				RATE_LIMITER_EMAIL_FLOWS_POINTS: 1,
				RATE_LIMITER_EMAIL_FLOWS_DURATION: 1,
				RATE_LIMITER_EMAIL_FLOWS_ERROR_MESSAGE: 'My custom message.',
			});

			// dynamic import because useEnv is accessed in the file root
			const { useFlowsEmailRateLimiter } = await import('./rate-limiter.js');

			// consume 2 points
			await expect(
				Promise.all([useFlowsEmailRateLimiter(TEST_FLOW_ID_1), useFlowsEmailRateLimiter(TEST_FLOW_ID_1)]),
			).rejects.toThrowError(/^Email sending limit exceeded\..*My custom message\.$/);
		});

		test('should be able to consume points from multiple flows without error', async () => {
			vi.mocked(useEnv).mockReturnValue({
				RATE_LIMITER_EMAIL_FLOWS_ENABLED: 'true',
				RATE_LIMITER_EMAIL_FLOWS_POINTS: 2,
				RATE_LIMITER_EMAIL_FLOWS_DURATION: 10,
			});

			// dynamic import because useEnv is accessed in the file root
			const { useFlowsEmailRateLimiter } = await import('./rate-limiter.js');

			// consume 3 points
			await expect(
				Promise.all([
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_1),
					useFlowsEmailRateLimiter(TEST_FLOW_ID_2),
				]),
			).resolves.not.toThrowError();
		});
	});
});
