import { afterEach, beforeAll, describe, expect, SpyInstance, test, vi } from 'vitest';

import * as axios from 'axios';
import config from './index';

vi.mock('axios', () => ({
	default: vi.fn().mockResolvedValue({
		status: 200,
		statusText: 'OK',
		headers: {},
		data: {},
	}),
}));

const url = '/';
const method = 'POST';

describe('Operations / Request', () => {
	let axiosSpy: SpyInstance;

	beforeAll(() => {
		axiosSpy = vi.spyOn(axios, 'default');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('no headers configured', async () => {
		const body = 'body';
		const headers = undefined;
		await config.handler({ url, method, body, headers }, {} as any);

		expect(axiosSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				url,
				method,
				data: body,
				headers: {},
			})
		);
	});

	test('headers array is converted to object', async () => {
		const body = 'body';
		const headers = [
			{ header: 'header1', value: 'value1' },
			{ header: 'header2', value: 'value2' },
		];
		await config.handler({ url, method, body, headers }, {} as any);

		expect(axiosSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				url,
				method,
				data: body,
				headers: expect.objectContaining({
					header1: 'value1',
					header2: 'value2',
				}),
			})
		);
	});

	test('should not automatically set Content-Type header when it is already defined', async () => {
		const body = 'body';
		const headers = [{ header: 'Content-Type', value: 'application/octet-stream' }];
		await config.handler({ url, method, body, headers }, {} as any);

		expect(axiosSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				url,
				method,
				data: body,
				headers: expect.objectContaining({
					'Content-Type': expect.not.stringContaining('application/json'),
				}),
			})
		);
	});

	test('should not automatically set Content-Type header to "application/json" when the body is not a valid JSON string', async () => {
		const body = '"a": "b"';
		const headers = [{ header: 'header1', value: 'value1' }];
		await config.handler({ url, method, body, headers }, {} as any);

		expect(axiosSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				url,
				method,
				data: body,
				headers: expect.not.objectContaining({
					'Content-Type': 'application/json',
				}),
			})
		);
	});

	test('should automatically set Content-Type header to "application/json" when the body is a valid JSON string', async () => {
		const body = '{ "a": "b" }';
		const headers = [{ header: 'header1', value: 'value1' }];
		await config.handler({ url, method, body, headers }, {} as any);

		expect(axiosSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				url,
				method,
				data: body,
				headers: expect.objectContaining({
					header1: 'value1',
					'Content-Type': 'application/json',
				}),
			})
		);
	});
});
