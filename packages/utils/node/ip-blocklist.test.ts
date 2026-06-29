import os from 'node:os';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { IpBlocklist } from './ip-blocklist.js';

vi.mock('node:os');

afterEach(() => {
	vi.resetAllMocks();
});

describe('IpBlocklist', () => {
	let blocklist: IpBlocklist;

	beforeEach(() => {
		blocklist = new IpBlocklist();
	});

	describe('parseAddress', () => {
		test('adds IPv4 address to blocklist', () => {
			blocklist.parseAddress('192.168.1.1');

			expect(blocklist.checkAddress('192.168.1.1')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.2')).toBe(false);
		});

		test('adds IPv6 address to blocklist', () => {
			blocklist.parseAddress('::1');

			expect(blocklist.checkAddress('::1')).toBe(true);
			expect(blocklist.checkAddress('::2')).toBe(false);
		});

		test('adds full IPv6 address to blocklist', () => {
			blocklist.parseAddress('2001:db8::1');

			expect(blocklist.checkAddress('2001:db8::1')).toBe(true);
			expect(blocklist.checkAddress('2001:db8::2')).toBe(false);
		});
	});

	describe('embedded IPv4 in IPv6 transition forms', () => {
		test('blocks IPv4-mapped / IPv4-compatible / NAT64 / 6to4 forms of a denied IPv4', () => {
			blocklist.parseAddress('169.254.169.254');

			expect(blocklist.checkAddress('169.254.169.254')).toBe(true);
			expect(blocklist.checkAddress('::ffff:169.254.169.254')).toBe(true); // IPv4-mapped
			expect(blocklist.checkAddress('::a9fe:a9fe')).toBe(true); // IPv4-compatible
			expect(blocklist.checkAddress('64:ff9b::a9fe:a9fe')).toBe(true); // NAT64
			expect(blocklist.checkAddress('2002:a9fe:a9fe::')).toBe(true); // 6to4
			expect(blocklist.checkAddress('2002:a9fe:a9fe:abcd:1:2:3:4')).toBe(true);
		});

		test('blocks transition forms of a denied IPv4 subnet', () => {
			blocklist.parseSubnet('10.0.0.0/8');

			expect(blocklist.checkAddress('::a00:5')).toBe(true); // ::10.0.0.5
			expect(blocklist.checkAddress('64:ff9b::a00:5')).toBe(true); // NAT64 10.0.0.5
			expect(blocklist.checkAddress('2002:a00:5::')).toBe(true); // 6to4 10.0.0.5
		});

		test('does not block transition forms of a public IPv4', () => {
			blocklist.parseAddress('169.254.169.254');

			expect(blocklist.checkAddress('::ffff:8.8.8.8')).toBe(false);
			expect(blocklist.checkAddress('::808:808')).toBe(false); // ::8.8.8.8
			expect(blocklist.checkAddress('2002:808:808::')).toBe(false); // 6to4 8.8.8.8
			expect(blocklist.checkAddress('64:ff9b::808:808')).toBe(false); // NAT64 8.8.8.8
		});

		test('does not treat :: / ::1 as an embedded IPv4 of a denied 0.0.0.0/8', () => {
			blocklist.parseSubnet('0.0.0.0/8');

			// ::1 and :: must not be classified as ::0.0.0.1 / ::0.0.0.0 and matched against the IPv4 rule
			expect(blocklist.checkAddress('::1')).toBe(false);
			expect(blocklist.checkAddress('::')).toBe(false);
		});
	});

	describe('parseSubnet', () => {
		test('adds IPv4 subnet to blocklist', () => {
			blocklist.parseSubnet('192.168.1.0/24');

			expect(blocklist.checkAddress('192.168.1.1')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.255')).toBe(true);
			expect(blocklist.checkAddress('192.168.2.1')).toBe(false);
		});

		test('adds IPv6 subnet to blocklist', () => {
			blocklist.parseSubnet('2001:db8::/32');

			expect(blocklist.checkAddress('2001:db8::1')).toBe(true);
			expect(blocklist.checkAddress('2001:db8:ffff::1')).toBe(true);
			expect(blocklist.checkAddress('2001:db9::1')).toBe(false);
		});

		test('throws error for invalid subnet format without slash', () => {
			expect(() => blocklist.parseSubnet('192.168.1.0')).toThrow('ERR_INVALID_SUBNET');
		});

		test('throws error for invalid subnet format with empty prefix', () => {
			expect(() => blocklist.parseSubnet('192.168.1.0/')).toThrow('ERR_INVALID_SUBNET');
		});

		test('throws error for invalid subnet format with empty address', () => {
			expect(() => blocklist.parseSubnet('/24')).toThrow('ERR_INVALID_SUBNET');
		});
	});

	describe('parseRange', () => {
		test('adds IPv4 range to blocklist', () => {
			blocklist.parseRange('192.168.1.1-192.168.1.10');

			expect(blocklist.checkAddress('192.168.1.1')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.5')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.10')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.11')).toBe(false);
		});

		test('adds IPv6 range to blocklist', () => {
			blocklist.parseRange('2001:db8::1-2001:db8::10');

			expect(blocklist.checkAddress('2001:db8::1')).toBe(true);
			expect(blocklist.checkAddress('2001:db8::5')).toBe(true);
			expect(blocklist.checkAddress('2001:db8::10')).toBe(true);
			expect(blocklist.checkAddress('2001:db8::11')).toBe(false);
		});

		test('throws error for invalid range format without dash', () => {
			expect(() => blocklist.parseRange('192.168.1.1')).toThrow('ERR_INVALID_RANGE');
		});

		test('throws error for invalid range format with empty end', () => {
			expect(() => blocklist.parseRange('192.168.1.1-')).toThrow('ERR_INVALID_RANGE');
		});

		test('throws error for invalid range format with empty start', () => {
			expect(() => blocklist.parseRange('-192.168.1.10')).toThrow('ERR_INVALID_RANGE');
		});
	});

	describe('checkAddress', () => {
		test('returns false for empty blocklist', () => {
			expect(blocklist.checkAddress('192.168.1.1')).toBe(false);
		});

		test('correctly identifies IPv4 addresses', () => {
			blocklist.parseAddress('10.0.0.1');

			expect(blocklist.checkAddress('10.0.0.1')).toBe(true);
			expect(blocklist.checkAddress('10.0.0.2')).toBe(false);
		});

		test('correctly identifies IPv6 addresses', () => {
			blocklist.parseAddress('fe80::1');

			expect(blocklist.checkAddress('fe80::1')).toBe(true);
			expect(blocklist.checkAddress('fe80::2')).toBe(false);
		});
	});

	describe('addNetworkInterfaces', () => {
		test('adds internal interface subnets to blocklist', () => {
			vi.mocked(os.networkInterfaces).mockReturnValue({
				lo0: [
					{
						address: '127.0.0.1',
						netmask: '255.0.0.0',
						family: 'IPv4',
						mac: '00:00:00:00:00:00',
						internal: true,
						cidr: '127.0.0.0/8',
					},
				],
			});

			blocklist.addLocalNetworkInterfaces();

			expect(blocklist.checkAddress('127.0.0.1')).toBe(true);
			expect(blocklist.checkAddress('127.255.255.255')).toBe(true);
		});

		test('adds external interface addresses to blocklist', () => {
			vi.mocked(os.networkInterfaces).mockReturnValue({
				en0: [
					{
						address: '192.168.1.100',
						netmask: '255.255.255.0',
						family: 'IPv4',
						mac: '00:00:00:00:00:00',
						internal: false,
						cidr: '192.168.1.100/24',
					},
				],
			});

			blocklist.addLocalNetworkInterfaces();

			expect(blocklist.checkAddress('192.168.1.100')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.101')).toBe(false);
		});

		test('handles undefined network interfaces', () => {
			vi.mocked(os.networkInterfaces).mockReturnValue({
				fa0: undefined,
			});

			expect(() => blocklist.addLocalNetworkInterfaces()).not.toThrow();
		});

		test('adds IPv6 loopback interface', () => {
			vi.mocked(os.networkInterfaces).mockReturnValue({
				lo0: [
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

			blocklist.addLocalNetworkInterfaces();

			expect(blocklist.checkAddress('::1')).toBe(true);
		});

		test('handles mixed IPv4 and IPv6 interfaces', () => {
			vi.mocked(os.networkInterfaces).mockReturnValue({
				lo0: [
					{
						address: '127.0.0.1',
						netmask: '255.0.0.0',
						family: 'IPv4',
						mac: '00:00:00:00:00:00',
						internal: true,
						cidr: '127.0.0.0/8',
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
				en0: [
					{
						address: '192.168.1.50',
						netmask: '255.255.255.0',
						family: 'IPv4',
						mac: '00:00:00:00:00:00',
						internal: false,
						cidr: '192.168.1.50/24',
					},
				],
			});

			blocklist.addLocalNetworkInterfaces();

			expect(blocklist.checkAddress('127.0.0.1')).toBe(true);
			expect(blocklist.checkAddress('127.1.2.3')).toBe(true);
			expect(blocklist.checkAddress('::1')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.50')).toBe(true);
			expect(blocklist.checkAddress('192.168.1.51')).toBe(false);
		});
	});
});
