import os from 'node:os';
import { useEnv } from '@directus/env';
import type { Logger } from 'pino';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { useLogger } from '../logger/index.js';
import { isDeniedIp } from './is-denied-ip.js';

vi.mock('node:os');
vi.mock('@directus/env');
vi.mock('../logger/index.js');

afterEach(() => {
	vi.resetAllMocks();
});

test(`Returns false if deny list is empty`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: [] });

	const result = isDeniedIp('203.0.113.1');

	expect(result).toBe(false);
});

test(`Returns false if IP is not in deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['192.168.1.0/24'] });

	const result = isDeniedIp('10.0.0.1');

	expect(result).toBe(false);
});

test(`Returns true if IP is in deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['192.168.1.0/24'] });

	const result = isDeniedIp('192.168.1.100');

	expect(result).toBe(true);
});

test(`Returns true and logs error if deny list is invalid`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['invalid'] });

	const mockLogger = {
		warn: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);

	const result = isDeniedIp('203.0.113.1');

	expect(result).toBe(true);
	expect(mockLogger.warn).toHaveBeenCalledWith(`Cannot verify IP address due to invalid "IMPORT_IP_DENY_LIST" config`);
	expect(mockLogger.warn).toHaveBeenCalled();
});

test(`Checks against IPs of local network interfaces if deny list contains 0.0.0.0`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });

	vi.mocked(os.networkInterfaces).mockReturnValue({});

	const result = isDeniedIp('203.0.113.1');

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
				address: '192.168.1.10',
				netmask: '255.0.0.0',
				family: 'IPv4',
				mac: '00:00:00:00:00:00',
				internal: false,
				cidr: '127.0.0.1/8',
			},
		],
	});

	const result = isDeniedIp('192.168.1.10');

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

test(`Returns true if IPv6-mapped IPv4 loopback address is checked against 0.0.0.0 deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({ IMPORT_IP_DENY_LIST: ['0.0.0.0'] });

	const mockLogger = {
		warn: vi.fn(),
	} as unknown as Logger;

	vi.mocked(useLogger).mockReturnValue(mockLogger);

	vi.mocked(os.networkInterfaces).mockReturnValue({
		lo0: [
			{
				address: '127.0.0.1',
				netmask: '255.0.0.0',
				family: 'IPv4',
				mac: '00:00:00:00:00:00',
				internal: true,
				cidr: '127.0.0.1/8',
			},
			{
				address: '::1',
				netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
				family: 'IPv6',
				mac: '00:00:00:00:00:00',
				internal: true,
				cidr: '::1/128',
				scopeid: 0,
			},
		],
	});

	// IPv6-mapped IPv4 formats that represent 127.0.0.1
	expect(isDeniedIp('::ffff:7f00:1')).toBe(true);
	expect(isDeniedIp('::ffff:127.0.0.1')).toBe(true);
	expect(isDeniedIp('::ffff:7f00:0001')).toBe(true);
	expect(isDeniedIp('0:0:0:0:0:ffff:7f00:1')).toBe(true);
	expect(isDeniedIp('0000:0000:0000:0000:0000:ffff:7f00:0001')).toBe(true);

	// Other loopback addresses in IPv6-mapped format
	expect(isDeniedIp('::ffff:127.0.0.2')).toBe(true);
	expect(isDeniedIp('::ffff:127.1.1.1')).toBe(true);
	expect(isDeniedIp('::ffff:7f7f:7f7f')).toBe(true); // 127.127.127.127

	// Pure IPv6 loopback
	expect(isDeniedIp('::1')).toBe(true);
	expect(isDeniedIp('0:0:0:0:0:0:0:1')).toBe(true);
	expect(isDeniedIp('0000:0000:0000:0000:0000:0000:0000:0001')).toBe(true);
});

test(`Returns true if IPv6-mapped IPv4 private network addresses are checked against explicit deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({
		IMPORT_IP_DENY_LIST: ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
	});

	// IPv6-mapped versions of private network IPs
	expect(isDeniedIp('::ffff:192.168.1.1')).toBe(true);
	expect(isDeniedIp('::ffff:c0a8:101')).toBe(true); // 192.168.1.1 in hex
	expect(isDeniedIp('::ffff:10.0.0.1')).toBe(true);
	expect(isDeniedIp('::ffff:a00:1')).toBe(true); // 10.0.0.1 in hex
	expect(isDeniedIp('::ffff:172.16.0.1')).toBe(true);
	expect(isDeniedIp('::ffff:ac10:1')).toBe(true); // 172.16.0.1 in hex
});

test(`Returns true if IPv6-mapped AWS metadata IP is checked against explicit deny list`, async () => {
	vi.mocked(useEnv).mockReturnValue({
		IMPORT_IP_DENY_LIST: ['169.254.169.254'],
	});

	// IPv6-mapped versions of AWS metadata service IP
	expect(isDeniedIp('::ffff:169.254.169.254')).toBe(true);
	expect(isDeniedIp('::ffff:a9fe:a9fe')).toBe(true); // 169.254.169.254 in hex
	expect(isDeniedIp('0:0:0:0:0:ffff:a9fe:a9fe')).toBe(true);
	expect(isDeniedIp('0000:0000:0000:0000:0000:ffff:a9fe:a9fe')).toBe(true);
});
