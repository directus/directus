import { randIp, randUrl } from '@ngneat/falso';
import os from 'node:os';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useEnv } from '../env.js';
import { validateIP } from './validate-ip.js';

vi.mock('node:os');

vi.mock('../env.js');

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
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '' });

	await validateIP(sample.ip, sample.url);
});

test(`Does nothing if IP is valid outside of ip range`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '111.22.33.44-222.33.44.55' });

	for (const ip of ['110.22.33.44', '111.22.33.43', '222.33.44.56', '223.33.44.55']) {
		await validateIP(ip, sample.url);
	}
});

test(`Does nothing if IP is valid outside of cidr range`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '111.22.33.44/31' });

	for (const ip of ['111.22.33.43', '111.22.33.46']) {
		await validateIP(ip, sample.url);
	}
});

test(`Throws error if passed IP is denylisted`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: sample.ip });

	try {
		await validateIP(sample.ip, sample.url);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe(`Requested URL "${sample.url}" resolves to a denied IP address`);
	}
});

test(`Throws error if passed IP is denylisted within the ip range`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '111.22.33.44-222.33.44.55' });

	for (const ip of ['111.22.33.44', '112.22.33.44', '221.33.44.55', '222.33.44.55']) {
		try {
			await validateIP(ip, sample.url);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Requested URL "${sample.url}" resolves to a denied IP address`);
		}
	}
});

test(`Throws error if passed IP is denylisted within the cidr range`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '111.22.33.44/31' });

	for (const ip of ['111.22.33.44', '111.22.33.45']) {
		try {
			await validateIP(ip, sample.url);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Requested URL "${sample.url}" resolves to a denied IP address`);
		}
	}
});

test(`Checks against IPs of local networkInterfaces if IP deny list contains 0.0.0.0`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '0.0.0.0' });

	vi.mocked(os.networkInterfaces).mockReturnValue({});
	await validateIP(sample.ip, sample.url);
	expect(os.networkInterfaces).toHaveBeenCalledOnce();
});

test(`Throws error if IP address matches resolved localhost IP`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: '0.0.0.0' });

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
