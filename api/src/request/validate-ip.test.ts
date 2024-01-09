import { useEnv } from '@directus/env';
import { randIp, randUrl } from '@ngneat/falso';
import os from 'node:os';
import type { Logger } from 'pino';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../logger.js';
import { ipInNetworks } from '../utils/ip-in-networks.js';
import { validateIp } from './validate-ip.js';

vi.mock('node:os');
vi.mock('@directus/env');
vi.mock('../logger.js');
vi.mock('../utils/ip-in-networks.js');

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

test(`Does nothing if deny list is empty`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [] });

	validateIp(sample.ip, sample.url);
});

test(`Does nothing if IP is not in deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [sample.ip] });
	vi.mocked(ipInNetworks).mockReturnValue(false);

	validateIp(sample.ip, sample.url);
});

test(`Throws error if IP is in deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [sample.ip] });
	vi.mocked(ipInNetworks).mockReturnValue(true);

	expect(() => validateIp(sample.ip, sample.url)).toThrowError(
		`Requested URL "${sample.url}" resolves to a denied IP address`,
	);
});

test(`Throws and logs error if deny list is invalid`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['invalid'] });

	const mockLogger = {
		warn: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);

	const error = new Error();

	vi.mocked(ipInNetworks).mockImplementation(() => {
		throw error;
	});

	expect(() => validateIp(sample.ip, sample.url)).toThrowError(
		`Requested URL "${sample.url}" resolves to a denied IP address`,
	);

	expect(mockLogger.warn).toHaveBeenCalledWith(`Invalid "IMPORT_IP_DENY_LIST" configuration`);
	expect(mockLogger.warn).toHaveBeenCalledWith(error);
});

test(`Checks against IPs of local network interfaces if deny list contains 0.0.0.0`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });

	vi.mocked(os.networkInterfaces).mockReturnValue({});
	validateIp(sample.ip, sample.url);
	expect(os.networkInterfaces).toHaveBeenCalledOnce();
});

test(`Throws error if IP matches resolved local network interface address`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });

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

	expect(() => validateIp(sample.ip, sample.url)).toThrowError(
		`Requested URL "${sample.url}" resolves to a denied IP address`,
	);
});
