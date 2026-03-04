import { BlockList, type IPVersion, isIPv6 } from 'node:net';
import os from 'node:os';

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
	 * Adds all local network interface addresses to the blocklist.
	 * Internal interfaces are added as subnets (using CIDR notation),
	 * while external interfaces are added as individual addresses.
	 */
	addLocalNetworkInterfaces() {
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
	parseAddress(input: string) {
		const ipVersion = this.getIpVersion(input);
		this.addAddress(input, ipVersion);
	}

	/**
	 * Parses and adds a subnet in CIDR notation to the blocklist.
	 * @param input - The subnet in CIDR notation (e.g., '192.168.1.0/24' or '::1/128')
	 * @throws {Error} Throws 'ERR_INVALID_SUBNET' if the input format is invalid
	 */
	parseSubnet(input: string) {
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
	parseRange(input: string) {
		const parts = input.split('-');

		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error('ERR_INVALID_RANGE');
		}

		const ipVersion = this.getIpVersion(parts[0]);
		this.addRange(parts[0], parts[1], ipVersion);
	}

	/**
	 * Checks if an IP address is in the blocklist.
	 * Automatically detects the IP version.
	 * @param address - The IP address to check
	 * @returns True if the address is blocked, false otherwise
	 */
	checkAddress(address: string): boolean {
		const ipVersion = this.getIpVersion(address);
		return this.check(address, ipVersion);
	}
}
