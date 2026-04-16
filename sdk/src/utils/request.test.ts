import { afterEach, describe, expect, it, test, vi } from 'vitest';
import { RequestError } from './error.js';
import { request } from './request.js';

const fetchMock = vi.fn(async () => ({}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('Request', () => {
	describe('headers', () => {
		it('should default to empty headers object if no header provided', async () => {
			await request('https://example.com', {}, fetchMock);

			expect(fetchMock).toBeCalledWith('https://example.com', { headers: {} });
		});

		it('should default to empty headers object if non object header provided', async () => {
			await request('https://example.com', { headers: [] }, fetchMock);

			expect(fetchMock).toBeCalledWith('https://example.com', { headers: {} });
		});

		it('should leave headers as is if they are object', async () => {
			const options = { headers: { 'Content-Type': 'application/json' } };

			await request('https://example.com', options, fetchMock);

			expect(fetchMock).toBeCalledWith('https://example.com', options);
		});
	});

	describe('error handling', () => {
		it('should handle non object reason', async () => {
			vi.mocked(fetchMock).mockResolvedValue({
				headers: new Headers([['Content-Type', 'application/json']]),
				json: async () => 'Error',
				text: () => {},
				ok: false,
			});

			await expect(async () => await request('https://example.com', {}, fetchMock)).rejects.toThrowError(
				new RequestError('', {
					response: expect.objectContaining({ ok: false }) as unknown as Response,
					errors: 'Error' as any,
				}),
			);
		});

		it('should handle reason with errors array', async () => {
			vi.mocked(fetchMock).mockResolvedValue({ errors: [] });

			await expect(async () => await request('https://example.com', {}, fetchMock)).rejects.toThrowError(
				new RequestError('', {
					response: expect.objectContaining({ errors: [] }) as unknown as Response,
					errors: [],
				}),
			);
		});

		describe('should handle reason with errors array and data property', () => {
			const types = [{}, [], false, 1, '1', null];

			test.each(types)('Check %o', async (type) => {
				vi.mocked(fetchMock).mockResolvedValue({ errors: [], data: type });

				await expect(async () => await request('https://example.com', {}, fetchMock)).rejects.toThrowError(
					new RequestError('', {
						response: expect.objectContaining({ errors: [], data: type }) as unknown as Response,
						errors: [],
						data: type,
					}),
				);
			});
		});

		it('should handle reason with non array errors', async () => {
			vi.mocked(fetchMock).mockResolvedValue({ errors: 'Error' });

			await expect(async () => await request('https://example.com', {}, fetchMock)).rejects.toThrowError(
				new RequestError('', {
					response: expect.objectContaining({ errors: 'Error' }) as unknown as Response,
					errors: 'Error' as any,
				}),
			);
		});

		it('should handle reason with message property in errors array', async () => {
			vi.mocked(fetchMock).mockResolvedValue({ errors: [{ message: 'Error' }] });

			await expect(async () => await request('https://example.com', {}, fetchMock)).rejects.toThrowError(
				new RequestError('Error', {
					response: expect.objectContaining({ errors: [{ message: 'Error' }] }) as unknown as Response,
					errors: [{ message: 'Error' }] as any,
				}),
			);
		});
	});
});
