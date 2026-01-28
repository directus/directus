import { describe, expect, test } from 'vitest';
import { getIPv4FromMappedIPv6, sanitizeIPv6 } from './normalize-ipv6.js';

describe('sanitizeIPv6', () => {
	test.each([
		// Bracket removal
		{ input: '[::ffff:1.2.3.4]', expected: '::ffff:1.2.3.4', description: 'removes brackets from IPv6 address' },
		{
			input: '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]',
			expected: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
			description: 'removes brackets from full IPv6 address',
		},
		{ input: '::1', expected: '::1', description: 'handles address without brackets' },
		{ input: '[::1', expected: '[::1', description: 'handles address with only opening bracket' },
		{ input: '::1]', expected: '::1]', description: 'handles address with only closing bracket' },
		{ input: '[[::1]]', expected: '[::1]', description: 'handles nested brackets (only outer removed)' },
		{ input: '[ ::1 ]', expected: ' ::1 ', description: 'handles spaces inside brackets' },

		// Zone ID removal
		{ input: 'fe80::1%eth0', expected: 'fe80::1', description: 'removes zone ID from IPv6 address' },
		{ input: 'fe80::abc:def%en0', expected: 'fe80::abc:def', description: 'removes zone ID from link-local address' },
		{ input: '2001:db8::1', expected: '2001:db8::1', description: 'handles address without zone ID' },
		{ input: 'fe80::1%', expected: 'fe80::1', description: 'handles empty zone ID' },
		{
			input: 'fe80::1%eth0%backup',
			expected: 'fe80::1',
			description: 'handles multiple % symbols (removes from first)',
		},
		{ input: 'fe80::1%123', expected: 'fe80::1', description: 'handles numeric zone ID' },
		{ input: 'fe80::1%eth-0', expected: 'fe80::1', description: 'handles zone ID with hyphen' },

		// Combined operations
		{ input: '[fe80::1%eth0]', expected: 'fe80::1', description: 'removes both brackets and zone ID' },
		{ input: '  ::1  ', expected: '::1', description: 'trims whitespace from address' },
		{ input: '  [fe80::1%eth0]  ', expected: 'fe80::1', description: 'handles brackets, zone ID, and whitespace' },
		{ input: '\t[::1]\n', expected: '::1', description: 'handles tabs and newlines' },

		// IPv4 addresses (passthrough after trimming)
		{ input: '192.168.1.1', expected: '192.168.1.1', description: 'handles IPv4 address' },
		{ input: '  192.168.1.1  ', expected: '192.168.1.1', description: 'trims whitespace from IPv4 address' },

		// Empty/whitespace-only strings
		{ input: '', expected: '', description: 'handles empty string' },
		{ input: '   ', expected: '', description: 'handles whitespace-only string' },
	])('$description', ({ input, expected }) => {
		expect(sanitizeIPv6(input)).toBe(expected);
	});
});

describe('getIPv4FromMappedIPv6', () => {
	describe('valid IPv4-mapped IPv6 addresses', () => {
		test.each([
			{ input: '::ffff:c0a8:0101', expected: '192.168.1.1', description: 'hex notation' },
			{ input: '0:0:0:0:0:ffff:c0a8:0101', expected: '192.168.1.1', description: 'fully expanded' },
			{ input: '[::ffff:0102:0304]', expected: '1.2.3.4', description: 'bracketed' },
			{ input: '::ffff:7f00:0001', expected: '127.0.0.1', description: 'localhost' },
			{ input: '::ffff:0:0', expected: '0.0.0.0', description: '0.0.0.0' },
			{ input: '::ffff:ffff:ffff', expected: '255.255.255.255', description: '255.255.255.255' },
			{ input: '::ffff:c0a8:0101%eth0', expected: '192.168.1.1', description: 'with zone ID' },
			{ input: '::ffff:0a00:0001', expected: '10.0.0.1', description: '10.0.0.1' },

			// Case sensitivity edge cases
			{ input: '::FFFF:c0a8:0101', expected: '192.168.1.1', description: 'uppercase FFFF' },
			{ input: '::FfFf:C0A8:0101', expected: '192.168.1.1', description: 'mixed case' },

			// Leading zeros
			{ input: '::ffff:00c0:00a8', expected: '0.192.0.168', description: 'with leading zeros' },
			{
				input: '0000:0000:0000:0000:0000:ffff:c0a8:0101',
				expected: '192.168.1.1',
				description: 'fully expanded with leading zeros',
			},

			// Compression in different positions (but must result in 0:0:0:0:0:ffff)
			{ input: '0:0:0:0:0:ffff:c0a8:101', expected: '192.168.1.1', description: 'without leading zero in last group' },
			{
				input: '::0:ffff:c0a8:0101',
				expected: '192.168.1.1',
				description: 'compression with explicit zero before ffff',
			},

			// Whitespace handling (trimmed by sanitize)
			{ input: '  ::ffff:c0a8:0101  ', expected: '192.168.1.1', description: 'with leading/trailing spaces' },
			{ input: '\t::ffff:c0a8:0101\n', expected: '192.168.1.1', description: 'with tabs and newlines' },
		])('extracts IPv4 from $description', ({ input, expected }) => {
			expect(getIPv4FromMappedIPv6(input)).toBe(expected);
		});
	});

	describe('invalid or non-mapped addresses', () => {
		test.each([
			{ input: '2001:db8::1', description: 'regular IPv6 address' },
			{ input: '192.168.1.1', description: 'IPv4 address' },
			{ input: 'fe80::1', description: 'link-local IPv6' },
			{ input: '::1', description: 'loopback IPv6' },
			{ input: 'invalid', description: 'invalid IPv6' },
			{ input: '', description: 'empty string' },
			{ input: '::fffe:c0a8:0101', description: 'wrong prefix' },
			{ input: '0:0:0:0:1:ffff:c0a8:0101', description: 'non-zero 5th group' },
			{ input: '::ffff:192.168.1.1', description: 'dotted decimal notation (not supported)' },
			{ input: '::1::ffff:c0a8:0101', description: 'multiple :: segments' },
			{ input: '::ffff:gggg:hhhh', description: 'malformed hex groups' },
			{ input: '0:0:0:0:0:0:ffff:c0a8:0101', description: 'too many groups' },

			// IPv4-compatible addresses (security-relevant: different from IPv4-mapped)
			{ input: '::c0a8:0101', description: 'IPv4-compatible (no ffff prefix)' },
			{ input: '::192.168.1.1', description: 'IPv4-compatible dotted decimal' },

			// Compression edge cases
			{ input: '::ffff:', description: 'trailing colon after compression' },
			{ input: '::ffff:c0a8:', description: 'trailing colon in groups' },
			{ input: ':ffff:c0a8:0101', description: 'leading single colon' },
			{ input: 'ffff:c0a8:0101::', description: 'compression at end without proper prefix' },

			// Wrong number of groups
			{ input: '::ffff:c0a8', description: 'too few groups' },
			{ input: '0:0:0:ffff:c0a8:0101', description: 'too few groups (6 instead of 8)' },
			{ input: '0:0:0:0:0:0:0:ffff:c0a8:0101', description: 'too many groups (10 instead of 8)' },

			// Non-zero in first 5 groups
			{ input: '1::ffff:c0a8:0101', description: 'non-zero first group' },
			{ input: '0:1::ffff:c0a8:0101', description: 'non-zero second group' },
			{ input: '0:0:1::ffff:c0a8:0101', description: 'non-zero third group' },
			{ input: '0:0:0:1:0:ffff:c0a8:0101', description: 'non-zero fourth group' },

			// Invalid hex values
			{ input: '::ffff:10000:0', description: 'hex value too large (>0xffff)' },
			{ input: '::ffff:-1:0', description: 'negative hex value' },
		])('returns null for $description', ({ input }) => {
			expect(getIPv4FromMappedIPv6(input)).toBeNull();
		});
	});
});
