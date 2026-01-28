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
 * Validates that the prefix groups represent an IPv4-mapped IPv6 prefix (0:0:0:0:0:ffff).
 * Expands :: compression and checks that first 5 groups are 0 and 6th group is 0xffff.
 *
 * @param prefix - The prefix part before the IPv4 address (e.g., "::ffff" or "0:0:0:0:0:ffff")
 * @param expectedGroups - Expected number of groups after expansion (6 for prefix only, 8 for full address)
 */
function expandAndValidateIPv4MappedPrefix(prefix: string, expectedGroups: number): string[] | null {
	const parts = prefix.split('::');
	if (parts.length > 2) return null;

	const left = parts[0] ? parts[0].split(':') : [];
	const right = parts[1] ? parts[1].split(':') : [];

	// Expand to expected number of groups
	const groups: string[] = [];
	groups.push(...left.filter(Boolean));

	const missing = expectedGroups - (left.filter(Boolean).length + right.filter(Boolean).length);

	for (let i = 0; i < missing; i++) {
		groups.push('0');
	}

	groups.push(...right.filter(Boolean));

	// Must have exactly the expected number of groups
	if (groups.length !== expectedGroups) return null;

	// First 5 groups must be zero
	for (let i = 0; i < 5; i++) {
		if (parseInt(groups[i]!, 16) !== 0) return null;
	}

	// 6th group must be 0xffff
	if (parseInt(groups[5]!, 16) !== 0xffff) return null;

	return groups;
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
	if (isIPv6(ip) === false) return null;

	// Check for dotted-decimal notation: ::ffff:192.168.1.1
	// This format has the IPv4 address directly embedded after ::ffff:
	const lastColonIndex = ip.lastIndexOf(':');

	if (lastColonIndex !== -1) {
		const potentialIPv4 = ip.slice(lastColonIndex + 1);

		// Check if it looks like an IPv4 address (contains dots)
		if (potentialIPv4.includes('.')) {
			const prefix = ip.slice(0, lastColonIndex);

			// Validate the prefix is IPv4-mapped (expects 6 groups: 0:0:0:0:0:ffff)
			if (!expandAndValidateIPv4MappedPrefix(prefix, 6)) return null;

			// Validate IPv4 part: each octet must be 0-255
			const octets = potentialIPv4.split('.');

			for (const octet of octets) {
				const num = parseInt(octet, 10);
				if (isNaN(num) || num < 0 || num > 255) return null;
			}

			return potentialIPv4;
		}
	}

	// Handle hex notation: ::ffff:c0a8:0101
	// Validate the full address is IPv4-mapped (expects 8 groups: 0:0:0:0:0:ffff:xxxx:xxxx)
	const groups = expandAndValidateIPv4MappedPrefix(ip, 8);
	if (!groups) return null;

	// Convert the last two IPv6 groups from hex to decimal
	// groups[6] contains the first 2 octets, groups[7] contains the last 2 octets
	const hi = parseInt(groups[6]!, 16);
	const lo = parseInt(groups[7]!, 16);

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
