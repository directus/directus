import { describe, expect, test } from 'vitest';
import { isIpAccessValid } from './policies.js';

describe('isIpAccessValid', () => {
	describe('nullish and empty values', () => {
		test('rejects undefined', () => {
			expect(isIpAccessValid(undefined)).toBe(false);
		});

		test('accepts null', () => {
			expect(isIpAccessValid(null)).toBe(true);
		});

		test('accepts an empty array', () => {
			expect(isIpAccessValid([])).toBe(true);
		});
	});

	describe('single IP addresses', () => {
		test.each(['127.0.0.1', '10.0.0.1', '0.0.0.0', '255.255.255.255', ' 10.0.0.1', '10.0.0.1 '])(
			'accepts IPv4 %s',
			(ip) => {
				expect(isIpAccessValid([ip])).toBe(true);
			},
		);

		test.each(['::1', '::', '2001:db8::1', 'fe80::1', '2001:0db8:0000:0000:0000:0000:0000:0001'])(
			'accepts IPv6 %s',
			(ip) => {
				expect(isIpAccessValid([ip])).toBe(true);
			},
		);

		test.each(['10.0.0', '10.0.0.1.1', '256.0.0.1', '10.0.0.-1', 'not-an-ip', ''])('rejects malformed IP %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(false);
		});
	});

	describe('CIDR blocks', () => {
		test.each(['10.0.0.0/24', '10.0.0.1/24', '0.0.0.0/0', '192.168.1.0/32'])('accepts IPv4 CIDR %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(true);
		});

		test.each(['2001:db8::/32', '::/0', 'fe80::1/128'])('accepts IPv6 CIDR %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(true);
		});

		test.each([
			'10.0.0.1/33',
			'2001:db8::/129',
			'10.0.0.1/abc',
			'10.0.0.1/',
			'10.0.0.1/24.5',
			'10.0.0.1/-1',
			'/24',
			'10.0.0/24',
		])('rejects malformed CIDR %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(false);
		});

		test('rejects more than one prefix', () => {
			expect(isIpAccessValid(['10.0.0.1/24/8'])).toBe(false);
		});
	});

	describe('IP masks', () => {
		test.each(['10.0.0.0/255.255.255.0', '192.168.0.0/255.255.0.0', 'fe80::/ffff::'])('rejects mask %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(false);
		});
	});

	describe('IP ranges', () => {
		test.each(['10.0.0.1-10.0.0.5', '0.0.0.0-255.255.255.255', 'fe80::1-fe80::5', '::1-::2'])(
			'accepts range %s',
			(ip) => {
				expect(isIpAccessValid([ip])).toBe(true);
			},
		);

		test.each([
			'10.0.2.1-10.0.0.1',
			'10.0.0.1-',
			'-10.0.0.1',
			'-',
			'10.0.0.1-10.0.0.2-10.0.0.3',
			'10.0.0.1-not-an-ip',
			'10.0.0-10.0.0.5',
		])('rejects malformed range %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(false);
		});
	});

	describe('wildcards', () => {
		test.each(['10.0.0.*', '*', '*.*.*.*', '10.0.*.1'])('rejects wildcard %s', (ip) => {
			expect(isIpAccessValid([ip])).toBe(false);
		});
	});

	describe('non-string entries', () => {
		test.each([[123], [null], [undefined], [true], [{}], [[]], [['10.0.0.1']]])('rejects entry %s', (entry) => {
			expect(isIpAccessValid([entry])).toBe(false);
		});
	});

	describe('multiple entries', () => {
		test('accepts a list where every entry is valid', () => {
			expect(isIpAccessValid(['127.0.0.1', '10.0.0.0/24', '10.1.0.1-10.1.0.9', '::1'])).toBe(true);
		});

		test('rejects a list when the first entry is invalid', () => {
			expect(isIpAccessValid(['nope', '127.0.0.1'])).toBe(false);
		});

		test('rejects a list when a later entry is invalid', () => {
			expect(isIpAccessValid(['127.0.0.1', '10.0.0.0/24', 'nope'])).toBe(false);
		});
	});
});
