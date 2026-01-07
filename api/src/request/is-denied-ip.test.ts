import os from 'node:os';
import { useEnv } from '@directus/env';
import { ipInNetworks } from '@directus/utils/node';
import { randIp, randUrl } from '@ngneat/falso';
import type { Logger } from 'pino';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../logger/index.js';
import { isDeniedIp } from './is-denied-ip.js';

vi.mock('node:os');
vi.mock('@directus/env');
vi.mock('../logger/index.js');
vi.mock('@directus/utils/node');

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

test(`Returns false if deny list is empty`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [] });

	const result = isDeniedIp(sample.ip);

	expect(result).toBe(false);
});

test(`Returns false if IP is not in deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [sample.ip] });
	vi.mocked(ipInNetworks).mockReturnValue(false);

	const result = isDeniedIp(sample.ip);

	expect(result).toBe(false);
});

test(`Returns true if IP is in deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [sample.ip] });
	vi.mocked(ipInNetworks).mockReturnValue(true);

	const result = isDeniedIp(sample.ip);

	expect(result).toBe(true);
});

test(`Returns true and logs error if deny list is invalid`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['invalid'] });

	const mockLogger = {
		warn: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);

	const error = new Error();

	vi.mocked(ipInNetworks).mockImplementation(() => {
		throw error;
	});

	const result = isDeniedIp(sample.ip);

	expect(result).toBe(true);
	expect(mockLogger.warn).toHaveBeenCalledWith(`Cannot verify IP address due to invalid "IMPORT_IP_DENY_LIST" config`);
	expect(mockLogger.warn).toHaveBeenCalledWith(error);
});

test(`Checks against IPs of local network interfaces if deny list contains 0.0.0.0`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });

	vi.mocked(os.networkInterfaces).mockReturnValue({});

	const result = isDeniedIp(sample.ip);

	expect(result).toBe(false);
	expect(os.networkInterfaces).toHaveBeenCalledOnce();
});

test(`Returns true if IP matches resolved local network interface address`, async () => {
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
				internal: false,
				cidr: '127.0.0.1/8',
			},
		],
	});

	const result = isDeniedIp(sample.ip);

	expect(result).toBe(true);
});

test(`Returns true if IP matches resolved to local loopback devices`, async () => {
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
	});

	expect(isDeniedIp('127.0.0.1')).toBe(true);
	expect(isDeniedIp('127.8.16.32')).toBe(true);
	expect(isDeniedIp('127.127.127.127')).toBe(true);
});
