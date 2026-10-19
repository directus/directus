import { describe, expect, test } from 'vitest';
import { isIpAccessValid } from './policies.js';

describe('isIpAccessValid', () => {
	test.each([
		{ name: 'null', value: null },
		{ name: 'an empty list', value: [] },
		{ name: 'an IPv4 address', value: ['192.168.1.10'] },
		{ name: 'an IPv6 address', value: ['2001:db8::1'] },
		{ name: 'a CIDR block', value: ['10.0.0.0/24'] },
		{ name: 'an IP range', value: ['10.0.0.1-10.0.0.50'] },
		{ name: 'entries with surrounding whitespace', value: [' 10.0.0.0/24 ', '\t192.168.1.10\n'] },
		{ name: 'a mix of addresses, ranges and CIDR blocks', value: ['192.168.1.10', '10.0.0.1-10.0.0.50', '::1/128'] },
	])('accepts $name', ({ value }) => {
		expect(isIpAccessValid(value)).toBe(true);
	});

	test.each([
		{ name: 'undefined', value: undefined },
		{ name: 'a string instead of a list', value: '10.0.0.0/24' },
		{ name: 'an object instead of a list', value: { ip: '10.0.0.1' } },
		{ name: 'a non-string entry', value: [167772161] },
		{ name: 'a null entry', value: [null] },
		{ name: 'a wildcard', value: ['10.0.0.*'] },
		{ name: 'a subnet mask', value: ['10.0.0.0/255.255.255.0'] },
		{ name: 'a malformed prefix', value: ['10.0.0.0/ 24'] },
		{ name: 'a descending range', value: ['10.0.0.50-10.0.0.1'] },
		{ name: 'a hostname', value: ['localhost'] },
		{ name: 'an empty entry', value: [''] },
		{ name: 'one invalid entry among valid ones', value: ['192.168.1.10', 'not-an-ip', '10.0.0.0/24'] },
	])('rejects $name', ({ value }) => {
		expect(isIpAccessValid(value)).toBe(false);
	});
});
