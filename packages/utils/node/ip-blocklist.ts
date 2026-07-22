import { BlockList, type IPVersion, isIP, isIPv6 } from 'node:net';
import os from 'node:os';
import ipaddr from 'ipaddr.js';

/**
 * Parses an IPv6 address string into its 16 bytes using `ipaddr.js`, which
 * handles "::" compression and a trailing embedded IPv4 literal (e.g.
 * "::ffff:1.2.3.4"). Returns null if the input is not a valid IPv6 address.
 */
function ipv6ToBytes(address: string): number[] | null {
	const input = address.split('%')[0]; // drop any zone identifier, e.g. fe80::1%eth0

	if (!ipaddr.isValid(input)) return null;

	const parsed = ipaddr.parse(input);
	if (parsed.kind() !== 'ipv6') return null;

	return parsed.toByteArray();
}

/**
 * Extended BlockList class that simplifies IP address blocking operations.
 * Automatically detects IP version (IPv4/IPv6) and provides convenient methods
 * for parsing and checking addresses, subnets, and ranges.
 */
export class IpBlocklist extends BlockList {
	/**
	 * Determines the IP version of the given address.
	 * @param input - The IP address string to check
	 * @returns The IP version ('ipv4' or 'ipv6')
	 */
	private getIpVersion(input: string): IPVersion {
		return isIPv6(input) ? 'ipv6' : 'ipv4';
	}

	/**
	 * Returns the embedded IPv4 address(es) carried by IPv6 transition /
	 * compatibility forms. Node's BlockList already maps the IPv4-mapped
	 * (`::ffff:a.b.c.d`) form onto IPv4 rules, but not these, so a deny rule for
	 * e.g. `169.254.169.254` would otherwise be bypassable via `::a9fe:a9fe`
	 * (IPv4-compatible), `64:ff9b::a9fe:a9fe` (NAT64) or `2002:a9fe:a9fe::` (6to4).
	 * @param address - An IPv6 address string
	 */
	private embeddedIpv4(address: string): string[] {
		const bytes = ipv6ToBytes(address);
		if (!bytes) return [];

		const toV4 = (octets: number[]) => octets.join('.');
		const isZero = (start: number, end: number) => bytes.slice(start, end).every((byte) => byte === 0);
		const candidates: string[] = [];

		// IPv4-compatible ::/96 (deprecated, RFC 4291): ::a.b.c.d. Excludes ::, ::1 and
		// other ::0.0.0.0/8 forms, which are not routable embedded IPv4 targets.
		if (isZero(0, 12) && bytes[12] !== 0) candidates.push(toV4(bytes.slice(12, 16)));

		// NAT64 well-known prefix 64:ff9b::/96 (RFC 6052)
		if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b && isZero(4, 12)) {
			candidates.push(toV4(bytes.slice(12, 16)));
		}

		// 6to4 2002::/16: 2002:WWXX:YYZZ::
		if (bytes[0] === 0x20 && bytes[1] === 0x02) candidates.push(toV4(bytes.slice(2, 6)));

		return candidates;
	}

	/**
	 * Adds all local network interface addresses to the blocklist.
	 * Internal interfaces are added as subnets (using CIDR notation),
	 * while external interfaces are added as individual addresses.
	 */
	addLocalNetworkInterfaces(): void {
		const networkInterfaces = Object.values(os.networkInterfaces());

		for (const networkInfo of networkInterfaces) {
			if (!networkInfo) continue;

			for (const info of networkInfo) {
				if (info.internal && info.cidr) {
					this.parseSubnet(info.cidr);
				} else if (info.address) {
					this.parseAddress(info.address);
				}
			}
		}
	}

	/**
	 * Parses and adds a single IP address to the blocklist.
	 * Automatically detects the IP version.
	 * @param input - The IP address to block (IPv4 or IPv6)
	 */
	parseAddress(input: string): void {
		const ipVersion = this.getIpVersion(input);
		this.addAddress(input, ipVersion);
	}

	/**
	 * Parses and adds a subnet in CIDR notation to the blocklist.
	 * @param input - The subnet in CIDR notation (e.g., '192.168.1.0/24' or '::1/128')
	 * @throws {Error} Throws 'ERR_INVALID_SUBNET' if the input format is invalid
	 */
	parseSubnet(input: string): void {
		const parts = input.split('/');

		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error('ERR_INVALID_SUBNET');
		}

		const subnet = parseInt(parts[1], 10);
		const ipVersion = this.getIpVersion(parts[0]);
		this.addSubnet(parts[0], subnet, ipVersion);
	}

	/**
	 * Parses and adds an IP range to the blocklist.
	 * @param input - The IP range in 'start-end' format (e.g., '192.168.1.1-192.168.1.255')
	 * @throws {Error} Throws 'ERR_INVALID_RANGE' if the input format is invalid
	 */
	parseRange(input: string): void {
		const parts = input.split('-');

		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error('ERR_INVALID_RANGE');
		}

		const ipVersion = this.getIpVersion(parts[0]);
		this.addRange(parts[0], parts[1], ipVersion);
	}

	/**
	 * Checks if an IP address is in the blocklist.
	 * Automatically detects the IP version, and also classifies the embedded IPv4
	 * of IPv6 transition forms (IPv4-compatible / NAT64 / 6to4) so they cannot be
	 * used to bypass an IPv4 deny rule.
	 * @param address - The IP address to check
	 * @returns True if the address is blocked, false otherwise
	 */
	checkAddress(address: string): boolean {
		const ipVersion = this.getIpVersion(address);

		if (this.check(address, ipVersion)) return true;

		if (ipVersion === 'ipv6') {
			for (const v4 of this.embeddedIpv4(address)) {
				if (isIP(v4) === 4 && this.check(v4, 'ipv4')) return true;
			}
		}

		return false;
	}
}
