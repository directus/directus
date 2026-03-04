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
