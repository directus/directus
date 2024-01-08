import { randIp, randUrl } from '@ngneat/falso';
import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { responseInterceptor } from './response-interceptor.js';
import { validateIp } from './validate-ip.js';

vi.mock('./validate-ip');

let sample: {
	remoteAddress: string;
	url: string;
};

let sampleResponseConfig: AxiosResponse<any, any>;

beforeEach(() => {
	sample = {
		remoteAddress: randIp(),
		url: randUrl(),
	};

	sampleResponseConfig = {
		request: {
			socket: {
				remoteAddress: sample.remoteAddress,
			},
			url: sample.url,
		},
	} as AxiosResponse<any, any>;
});

afterEach(() => {
	vi.resetAllMocks();
});

test(`Calls validateIp with IP/URL from axios request config`, async () => {
	await responseInterceptor(sampleResponseConfig);
	expect(validateIp).toHaveBeenCalledWith(sample.remoteAddress, sample.url);
});

test(`Returns passed in config as-is`, async () => {
	const config = await responseInterceptor(sampleResponseConfig);
	expect(config).toBe(sampleResponseConfig);
});
