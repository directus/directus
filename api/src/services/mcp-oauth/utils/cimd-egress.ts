import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';
import { isSpecialUseIp } from './egress-policy.js';

const DEFAULT_DNS_DEADLINE_MS = 1_000;

/*
 * CIMD client IDs are URLs controlled by the client, so fetching their metadata
 * document is outbound egress against attacker-provided input. The OAuth CIMD
 * draft requires authorization servers to reject metadata document URLs that
 * resolve to RFC 6890 special-use addresses, with loopback allowed only where
 * explicitly permitted. Directus does not allow loopback CIMD fetches, so this
 * helper treats every special-use answer as blocked.
 *
 * The IP classification table is shared with JWKS fetching so metadata and key
 * retrieval cannot drift to different SSRF policies.
 */
export type CimdEgressErrorReason =
	| 'cimd_dns_empty_result'
	| 'cimd_dns_error'
	| 'cimd_dns_ip_literal'
	| 'cimd_dns_special_use_ip'
	| 'cimd_dns_timeout';

export class CimdEgressError extends Error {
	reason: CimdEgressErrorReason;

	constructor(reason: CimdEgressErrorReason, options?: ErrorOptions) {
		super(reason, options);
		this.name = 'CimdEgressError';
		this.reason = reason;
	}
}

export interface CimdResolver {
	resolve4(hostname: string): Promise<string[]>;
	resolve6(hostname: string): Promise<string[]>;
}

export interface ValidatedCimdAddresses {
	addresses4: string[];
	addresses6: string[];
}

const defaultResolver: CimdResolver = {
	resolve4,
	resolve6,
};

/*
 * Fetch and refresh paths validate the hostname immediately before outbound
 * CIMD metadata egress. Fresh cached metadata is used without a network lookup.
 */
export async function validateCimdHostnameEgress(
	hostname: string,
	options: { deadlineAt?: number; resolver?: CimdResolver } = {},
): Promise<ValidatedCimdAddresses> {
	const bareHostname = hostname.replace(/^\[|\]$/g, '');

	if (isIP(bareHostname)) {
		throw new CimdEgressError('cimd_dns_ip_literal');
	}

	const deadlineAt = options.deadlineAt ?? performance.now() + DEFAULT_DNS_DEADLINE_MS;
	const resolver = options.resolver ?? defaultResolver;

	if (deadlineAt - performance.now() <= 0) {
		throw new CimdEgressError('cimd_dns_timeout');
	}

	return withDeadline(resolveAndValidate(hostname, resolver), deadlineAt);
}

/*
 * Resolve A and AAAA independently and validate the complete answer set before
 * returning anything. A family-specific lookup request still validates both
 * families first so an attacker cannot hide a blocked address in the unrequested
 * family. ENODATA/ENOTFOUND only mean that one family is empty; other DNS
 * failures are indeterminate and fail closed.
 */
async function resolveAndValidate(hostname: string, resolver: CimdResolver): Promise<ValidatedCimdAddresses> {
	const [addresses4, addresses6] = await Promise.all([
		resolveFamily(() => resolver.resolve4(hostname)),
		resolveFamily(() => resolver.resolve6(hostname)),
	]);

	if (addresses4.length === 0 && addresses6.length === 0) {
		throw new CimdEgressError('cimd_dns_empty_result');
	}

	for (const address of [...addresses4, ...addresses6]) {
		if (isSpecialUseIp(address)) {
			throw new CimdEgressError('cimd_dns_special_use_ip');
		}
	}

	return { addresses4, addresses6 };
}

async function resolveFamily(resolve: () => Promise<string[]>): Promise<string[]> {
	try {
		return await resolve();
	} catch (error) {
		if (isEmptyDnsResult(error)) return [];

		throw new CimdEgressError('cimd_dns_error', { cause: error });
	}
}

function isEmptyDnsResult(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error.code === 'ENODATA' || error.code === 'ENOTFOUND')
	);
}

async function withDeadline<T>(promise: Promise<T>, deadlineAt: number): Promise<T> {
	const remainingMs = Math.min(DEFAULT_DNS_DEADLINE_MS, deadlineAt - performance.now());

	if (remainingMs <= 0) {
		throw new CimdEgressError('cimd_dns_timeout');
	}

	let timeoutId: NodeJS.Timeout | undefined;

	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => reject(new CimdEgressError('cimd_dns_timeout')), Math.ceil(remainingMs));
	});

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}
