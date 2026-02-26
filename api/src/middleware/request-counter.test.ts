import { afterEach, describe, expect, test, vi } from 'vitest';
import { useBufferedCounter } from '../telemetry/counter/use-buffered-counter.js';
import requestCounterMiddleware from './request-counter.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		TELEMETRY: true,
	}),
}));

vi.mock('../telemetry/counter/use-buffered-counter.js');

vi.mock('../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		trace: vi.fn(),
	}),
}));

const mockIncrement = vi.fn();

vi.mocked(useBufferedCounter).mockReturnValue({
	increment: mockIncrement,
} as any);

afterEach(() => {
	vi.clearAllMocks();
});

describe('requestCounter middleware', () => {
	describe('when TELEMETRY is enabled', () => {
		test('Creates a buffered counter with the "api-requests" namespace', () => {
			const req = { method: 'GET' } as any;
			const next = vi.fn();

			requestCounterMiddleware(req, {} as any, next);

			expect(useBufferedCounter).toHaveBeenCalledWith('api-requests');
		});

		test('Increments the counter with the request method in lowercase', () => {
			const req = { method: 'POST' } as any;
			const next = vi.fn();

			requestCounterMiddleware(req, {} as any, next);

			expect(mockIncrement).toHaveBeenCalledWith('post');
		});

		test('Calls next after incrementing', () => {
			const req = { method: 'GET' } as any;
			const next = vi.fn();

			requestCounterMiddleware(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
		});

		test('Only tracks GET, POST, PUT, PATCH, and DELETE methods', () => {
			const tracked = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
			const next = vi.fn();

			for (const method of tracked) {
				requestCounterMiddleware({ method } as any, {} as any, next);
			}

			expect(mockIncrement).toHaveBeenCalledTimes(tracked.length);

			for (const method of tracked) {
				expect(mockIncrement).toHaveBeenCalledWith(method.toLowerCase());
			}
		});

		test('Does not track OPTIONS, HEAD, or non-standard methods', () => {
			const untracked = ['OPTIONS', 'HEAD', 'PURGE'];
			const next = vi.fn();

			for (const method of untracked) {
				requestCounterMiddleware({ method } as any, {} as any, next);
			}

			expect(mockIncrement).not.toHaveBeenCalled();
		});

		test('Calls next even for untracked methods', () => {
			const req = { method: 'OPTIONS' } as any;
			const next = vi.fn();

			requestCounterMiddleware(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
		});

		test('Calls next even when useBufferedCounter throws', () => {
			vi.mocked(useBufferedCounter).mockImplementationOnce(() => {
				throw new Error('Counter initialization failed');
			});

			const req = { method: 'GET' } as any;
			const next = vi.fn();

			requestCounterMiddleware(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
		});

		test('Calls next even when increment throws', () => {
			vi.mocked(useBufferedCounter).mockReturnValueOnce({
				increment: vi.fn().mockImplementation(() => {
					throw new Error('Increment failed');
				}),
			} as any);

			const req = { method: 'GET' } as any;
			const next = vi.fn();

			requestCounterMiddleware(req, {} as any, next);

			expect(next).toHaveBeenCalledOnce();
		});
	});

	describe('when TELEMETRY is disabled', () => {
		test('Does not increment counter but still calls next', async () => {
			vi.resetModules();

			vi.doMock('@directus/env', () => ({
				useEnv: vi.fn().mockReturnValue({
					TELEMETRY: false,
				}),
			}));

			vi.doMock('../telemetry/counter/use-buffered-counter.js');

			const { default: disabledMiddleware } = await import('./request-counter.js');
			const req = { method: 'GET' } as any;
			const next = vi.fn();

			disabledMiddleware(req, {} as any, next);

			const { useBufferedCounter: mockedCounter } = await import('../telemetry/counter/use-buffered-counter.js');
			expect(mockedCounter).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledOnce();
		});
	});
});
