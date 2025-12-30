import { agentWithIpValidation } from './agent-with-ip-validation.js';
import { _cache, getAxios } from './index.js';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { Agent } from 'node:http';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('axios');
vi.mock('./agent-with-ip-validation.js');

let mockAxiosInstance: AxiosInstance;
let mockAgentWithIpValidation: Agent;

beforeEach(() => {
	mockAxiosInstance = {} as AxiosInstance;
	mockAgentWithIpValidation = {} as Agent;

	vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);
	vi.mocked(agentWithIpValidation).mockReturnValue(mockAgentWithIpValidation);
});

afterEach(() => {
	vi.clearAllMocks();
	_cache.axiosInstance = null;
});

test('Creates and returns new axios instance with custom agents if cache is empty', async () => {
	await getAxios();

	expect(axios.create).toHaveBeenCalledWith({
		httpAgent: mockAgentWithIpValidation,
		httpsAgent: mockAgentWithIpValidation,
	});
});

test('Returns axios instance from cache immediately if cache has been filled', async () => {
	_cache.axiosInstance = mockAxiosInstance;

	const instance = await getAxios();

	expect(instance).toBe(mockAxiosInstance);
	expect(axios.create).not.toHaveBeenCalled();
});
