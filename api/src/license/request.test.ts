import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const request = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn(() => ({ request })));
const isAxiosError = vi.hoisted(() => vi.fn((error) => error?.isAxiosError === true));

vi.mock('axios', () => ({
	default: {
		create,
		isAxiosError,
	},
	create,
	isAxiosError,
}));

async function loadRequestModule() {
	vi.resetModules();
	return await import('./request.js');
}

beforeEach(() => {
	request.mockReset();
	create.mockClear();
	isAxiosError.mockClear();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('license request client', () => {
	test('configures a request timeout on the shared axios client', async () => {
		const { getLicenseClient } = await loadRequestModule();

		getLicenseClient();

		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				timeout: 15_000,
			}),
		);
	});

	test('caps retry_after delays to sixty seconds', async () => {
		vi.useFakeTimers();

		request
			.mockRejectedValueOnce({
				isAxiosError: true,
				response: {
					status: 503,
					data: {
						retry_after: 999_999,
					},
				},
			})
			.mockResolvedValueOnce({
				data: { ok: true },
			});

		const { requestLicenseService } = await loadRequestModule();
		const responsePromise = requestLicenseService<{ ok: boolean }>('POST', '/api/licenses/check');

		await Promise.resolve();
		expect(request).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(59_999);
		expect(request).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(1);
		await expect(responsePromise).resolves.toEqual({ ok: true });
		expect(request).toHaveBeenCalledTimes(2);
	});
});
