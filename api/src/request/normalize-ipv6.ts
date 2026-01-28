import { isIPv6 } from 'node:net';

/**
 * Sanitizes an IPv6 address string by removing common formatting characters.
 * Removes brackets (from URL/literal format) and zone identifiers.
 *
 * @example
 * sanitizeIPv6('[::ffff:1.2.3.4]') // returns '::ffff:1.2.3.4'
 * sanitizeIPv6('fe80::1%eth0') // returns 'fe80::1'
 */
export function sanitizeIPv6(input: string): string {
	let result = input.trim();

	// Handle URLs / bracketed literals: "[::ffff:1.2.3.4]"
	if (result.startsWith('[') && result.endsWith(']')) {
		result = result.slice(1, -1);
	}

	// Remove IPv6 zone id if present: "fe80::1%eth0"
	const zoneIndex = result.indexOf('%');

	if (zoneIndex !== -1) {
		result = result.slice(0, zoneIndex);
	}

	return result;
}

/**
 * Extracts the IPv4 address from an IPv4-mapped IPv6 address.
 * IPv4-mapped IPv6 addresses have the format: ::ffff:x.x.x.x or 0:0:0:0:0:ffff:xxxx:xxxx
 *
 * @example
 * getIPv4FromMappedIPv6('::ffff:192.0.2.1') // returns '192.0.2.1'
 * getIPv4FromMappedIPv6('::ffff:c000:0201') // returns '192.0.2.1'
 * getIPv4FromMappedIPv6('fe80::1') // returns null (not IPv4-mapped)
 * getIPv4FromMappedIPv6('192.0.2.1') // returns null (not IPv6)
 */
export function getIPv4FromMappedIPv6(input: string): string | null {
	const ip = sanitizeIPv6(input);

	// Return if it is not an IPv6 address
	if (isIPv6(ip) === false) return null;

	// Split on '::' to handle zero-compression
	const parts = ip.split('::');
	// Multiple compression sequences is invalid in IPv6
	if (parts.length > 2) return null;

	const left = parts[0] ? parts[0].split(':') : [];
	const right = parts[1] ? parts[1].split(':') : [];

	// Expand to exactly 8 groups
	const groups = [];
	groups.push(...left.filter(Boolean));

	const missing = 8 - (left.filter(Boolean).length + right.filter(Boolean).length);

	// Fill in the missing groups with zeros
	for (let i = 0; i < missing; i++) {
		groups.push('0');
	}

	groups.push(...right.filter(Boolean));

	// IPv6 addresses must have exactly 8 groups after expansion
	if (groups.length !== 8) return null;

	// Check for IPv4-mapped prefix: 0:0:0:0:0:ffff
	for (let i = 0; i < 5; i++) {
		// First 5 groups must be zero for a valid IPv4-mapped address
		if (parseInt(groups[i], 16) !== 0) return null;
	}

	// 6th group must be 0xffff for a valid IPv4-mapped address
	if (parseInt(groups[5], 16) !== 0xffff) return null;

	// Convert the last two IPv6 groups from hex to decimal
	// groups[6] contains the first 2 octets, groups[7] contains the last 2 octets
	const hi = parseInt(groups[6], 16);
	const lo = parseInt(groups[7], 16);

	// Validate that both groups are valid integers
	if (!Number.isInteger(hi) || !Number.isInteger(lo)) return null;

	// Extract each byte to form the IPv4 address
	return [
		(hi >> 8) & 255, // shift right 8 bits to get high byte, mask to 8 bits
		hi & 255, // mask to get low byte (lower 8 bits)
		(lo >> 8) & 255, // shift right 8 bits to get high byte, mask to 8 bits
		lo & 255, // mask to get low byte (lower 8 bits)
	].join('.');
}
