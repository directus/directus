import { randIp, randUrl } from '@ngneat/falso';
import os from 'node:os';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getEnv } from '../env.js';
import { validateIP } from './validate-ip.js';

vi.mock('../env');
vi.mock('node:os');

let sample: {
	ip: string;
	url: string;
};

beforeEach(() => {
	sample = {
		ip: randIp(),
		url: randUrl(),
	};
});

afterEach(() => {
	vi.resetAllMocks();
});

test(`Does nothing if IP is valid`, async () => {
	vi.mocked(getEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [] });
	await validateIP(sample.ip, sample.url);
});

test(`Throws error if passed IP is denylisted`, async () => {
	vi.mocked(getEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [sample.ip] });

	try {
		await validateIP(sample.ip, sample.url);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe(`Requested URL "${sample.url}" resolves to a denied IP address`);
	}
});

test(`Checks against IPs of local networkInterfaces if IP deny list contains 0.0.0.0`, async () => {
	vi.mocked(getEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });
	vi.mocked(os.networkInterfaces).mockReturnValue({});
	await validateIP(sample.ip, sample.url);
	expect(os.networkInterfaces).toHaveBeenCalledOnce();
});

test(`Throws error if IP address matches resolved localhost IP`, async () => {
	vi.mocked(getEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });

	vi.mocked(os.networkInterfaces).mockReturnValue({
		fa0: undefined,
		lo0: [
			{
				address: '127.0.0.1',
				netmask: '255.0.0.0',
				family: 'IPv4',
				mac: '00:00:00:00:00:00',
				internal: true,
				cidr: '127.0.0.1/8',
			},
		],
		en0: [
			{
				address: sample.ip,
				netmask: '255.0.0.0',
				family: 'IPv4',
				mac: '00:00:00:00:00:00',
				internal: true,
				cidr: '127.0.0.1/8',
			},
		],
	});

	try {
		await validateIP(sample.ip, sample.url);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe(`Requested URL "${sample.url}" resolves to a denied IP address`);
	}
});
