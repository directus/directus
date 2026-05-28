import { isIP } from 'node:net';
import { IpBlocklist } from '@directus/utils/node';

/*
 * Shared outbound egress classifier for OAuth metadata/JWKS requests whose
 * target is controlled by an OAuth client. Keep the table explicit so policy
 * review is deterministic and does not require network access.
 */
const IPV4_BLOCKED_CIDRS = [
	'0.0.0.0/8',
	'0.0.0.0/32',
	'10.0.0.0/8',
	'100.64.0.0/10',
	'127.0.0.0/8',
	'169.254.0.0/16',
	'172.16.0.0/12',
	'192.0.0.0/24',
	'192.0.0.0/29',
	'192.0.0.8/32',
	'192.0.0.9/32',
	'192.0.0.10/32',
	'192.0.0.170/32',
	'192.0.0.171/32',
	'192.0.2.0/24',
	'192.31.196.0/24',
	'192.52.193.0/24',
	'192.88.99.0/24',
	'192.168.0.0/16',
	'192.175.48.0/24',
	'198.18.0.0/15',
	'198.51.100.0/24',
	'203.0.113.0/24',
	'224.0.0.0/4',
	'240.0.0.0/4',
	'255.255.255.255/32',
];

const IPV6_BLOCKED_CIDRS = [
	'::/128',
	'::1/128',
	'::ffff:0:0/96',
	'64:ff9b::/96',
	'64:ff9b:1::/48',
	'100::/64',
	'100:0:0:1::/64',
	'2001::/23',
	'2001::/32',
	'2001:1::1/128',
	'2001:1::2/128',
	'2001:1::3/128',
	'2001:2::/48',
	'2001:3::/32',
	'2001:4:112::/48',
	'2001:20::/28',
	'2001:30::/28',
	'2001:db8::/32',
	'2002::/16',
	'2620:4f:8000::/48',
	'3fff::/20',
	'5f00::/16',
	'fc00::/7',
	'fe80::/10',
	'ff00::/8',
];

const LOOPBACK_IPV4_CIDRS = ['127.0.0.0/8'];
const LOOPBACK_IPV6_CIDRS = ['::1/128'];

const blockedIpv4 = new IpBlocklist();
const blockedIpv6 = new IpBlocklist();
const loopbackIpv4 = new IpBlocklist();
const loopbackIpv6 = new IpBlocklist();

for (const cidr of IPV4_BLOCKED_CIDRS) {
	blockedIpv4.parseSubnet(cidr);
}

for (const cidr of IPV6_BLOCKED_CIDRS) {
	blockedIpv6.parseSubnet(cidr);
}

for (const cidr of LOOPBACK_IPV4_CIDRS) {
	loopbackIpv4.parseSubnet(cidr);
}

for (const cidr of LOOPBACK_IPV6_CIDRS) {
	loopbackIpv6.parseSubnet(cidr);
}

export function normalizeHostname(hostname: string): string {
	return hostname
		.replace(/^\[|\]$/g, '')
		.replace(/\.$/, '')
		.toLowerCase();
}

/** Fail-closed IP classifier for OAuth client-controlled egress. */
export function isSpecialUseIp(ip: string): boolean {
	const family = isIP(ip);

	if (family === 0) return true;

	try {
		return family === 4 ? blockedIpv4.check(ip, 'ipv4') : blockedIpv6.check(ip, 'ipv6');
	} catch {
		return true;
	}
}

export function isLoopbackIp(ip: string): boolean {
	const family = isIP(ip);

	if (family === 0) return false;

	try {
		return family === 4 ? loopbackIpv4.check(ip, 'ipv4') : loopbackIpv6.check(ip, 'ipv6');
	} catch {
		return false;
	}
}
