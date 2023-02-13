import { test, expect, vi, describe } from 'vitest';
import { getAxios } from './request';

vi.mock('./env', () => ({
	default: {
		IMPORT_IP_DENY_LIST: ['0.0.0.0', '192.0.2.1'],
	},
}));

vi.mock('axios', async () => {
	const actual = (await vi.importActual('axios')) as any;
	return {
		default: {
			...actual.default,
			create: (option: any) => actual.default.create({ ...option, adapter: async () => ({ status: 200 }) }),
		},
	};
});

vi.mock('node:dns/promises', () => ({
	lookup: async (hostname: any) => {
		if (hostname === 'nonexisting.example.com') throw new Error(`getaddrinfo ENOTFOUND ${hostname}`);
		return '198.51.100.1';
	},
}));

vi.mock('node:os', () => ({
	default: {
		networkInterfaces: () => ({
			lo: [
				{
					address: '127.0.0.1',
				},
			],
		}),
	},
}));

describe('should fail on invalid / denied URLs', async () => {
	const axios = await getAxios();

	test.each([
		['example.com', 'Requested URL "example.com" is invalid'],
		['127.0.0.1', 'Requested URL "127.0.0.1" is invalid'],
		['https://nonexisting.example.com', `Couldn't lookup the DNS for URL "https://nonexisting.example.com"`],
		['http://127.0.0.1', 'Requested URL "http://127.0.0.1" resolves to localhost'],
		['http://192.0.2.1', 'Requested URL "http://192.0.2.1" resolves to a denied IP address'],
	])('should block URL "%s"', async (url, expectedError) => {
		await expect(axios.get(url)).rejects.toThrow(expectedError);
	});

	test.each(['https://example.com', 'http://192.0.2.2'])('should pass URL "%s"', async (url) => {
		await expect(axios.get(url)).resolves.toContain({ status: 200 });
	});
});
