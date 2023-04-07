import { test, vi, afterEach, beforeEach, expect } from 'vitest';
import { getAxios, _cache } from './index.js';
import axios from 'axios';
import type { AxiosInstance } from 'axios';

vi.mock('axios');

let mockAxiosInstance: AxiosInstance;

beforeEach(() => {
	mockAxiosInstance = {
		interceptors: {
			request: {
				use: vi.fn(),
			},
			response: {
				use: vi.fn(),
			},
		},
	} as unknown as AxiosInstance;

	vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);
});

afterEach(() => {
	vi.resetAllMocks();
	_cache.axiosInstance = null;
});

test('Creates and returns new axios instance if cache is empty', async () => {
	const instance = await getAxios();
	expect(axios.create).toHaveBeenCalled();
	expect(instance).toBe(mockAxiosInstance);
});
