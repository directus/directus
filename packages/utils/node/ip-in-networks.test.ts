import { randIp, randIpv6 } from '@ngneat/falso';
import { describe, expect, test } from 'vitest';
import { ipInNetworks } from './ip-in-networks.js';

describe('IP address', () => {
	const ipv4 = randIp();
	const ipv6 = randIpv6();

	describe('succeeds on match', () => {
		test.each([ipv4, ipv6])('%s', (ip) => {
			expect(ipInNetworks(ip, [ip])).toBe(true);
		});
	});

	describe('fails on mismatch', () => {
		test.each([ipv4, ipv6])('%s', (ip) => {
			expect(ipInNetworks(ip, [])).toBe(false);
		});
	});

	test('works with multiple entries', () => {
		expect(ipInNetworks(ipv4, [randIp(), ipv4, randIpv6()])).toBe(true);
	});
});

describe('IP range', () => {
	const ipv4Range = '10.0.0.0-10.0.0.255';
	const ipv6Range = '2001:4860::-2001:4860:ffff:ffff:ffff:ffff:ffff:ffff';

	describe('succeeds on match', () => {
		test.each([
			['10.0.0.50', ipv4Range],
			['2001:4860::1', ipv6Range],
		])('%s', (ip, range) => {
			expect(ipInNetworks(ip, [range])).toBe(true);
		});
	});

	describe('fails on mismatch', () => {
		test.each([
			['10.0.1.1', ipv4Range],
			['2001:4861::1', ipv6Range],
		])('%s', (ip, range) => {
			expect(ipInNetworks(ip, [range])).toBe(false);
		});
	});
});

describe('CIDR block', () => {
	const ipv4Cidr = '10.0.0.0/24';
	const ipv6Cidr = '2001:4860::/32';

	describe('succeeds on match', () => {
		test.each([
			['10.0.0.50', ipv4Cidr],
			['2001:4860::1', ipv6Cidr],
		])('%s', (ip, range) => {
			expect(ipInNetworks(ip, [range])).toBe(true);
		});
	});

	describe('fails on mismatch', () => {
		test.each([
			['10.0.1.1', ipv4Cidr],
			['2001:4861::1', ipv6Cidr],
		])('%s', (ip, range) => {
			expect(ipInNetworks(ip, [range])).toBe(false);
		});
	});
});

test(`Throws if network definitions are invalid`, async () => {
	expect(() => ipInNetworks('192.168.0.1', ['invalid'])).toThrowError();
});
