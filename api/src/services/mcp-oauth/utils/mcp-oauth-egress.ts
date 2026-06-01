import { resolve4, resolve6 } from 'node:dns/promises';
import type http from 'node:http';
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
export type McpOAuthEgressErrorReason =
	| 'mcp_oauth_dns_empty_result'
	| 'mcp_oauth_dns_error'
	| 'mcp_oauth_dns_ip_literal'
	| 'mcp_oauth_dns_special_use_ip'
	| 'mcp_oauth_dns_timeout';

export class McpOAuthEgressError extends Error {
	reason: McpOAuthEgressErrorReason;

	constructor(reason: McpOAuthEgressErrorReason, options?: ErrorOptions) {
		super(reason, options);
		this.name = 'McpOAuthEgressError';
		this.reason = reason;
	}
}

export interface McpOAuthResolver {
	resolve4(hostname: string): Promise<string[]>;
	resolve6(hostname: string): Promise<string[]>;
}

export interface ValidatedMcpOAuthAddresses {
	addresses4: string[];
	addresses6: string[];
}

type AddressFamily = 4 | 6 | undefined;

interface McpOAuthLookupAddress {
	address: string;
	family?: AddressFamily;
}

const defaultResolver: McpOAuthResolver = {
	resolve4,
	resolve6,
};

/*
 * Axios passes this function down to Node's http/https stack as the per-request
 * DNS lookup hook. Returning our already-validated address keeps MCP OAuth's
 * A+AAAA validation coupled to the socket lookup that actually opens the connection.
 */
export function createMcpOAuthEgressLookup(options: {
	deadlineAt: number;
	resolver?: McpOAuthResolver;
}): NonNullable<http.AgentOptions['lookup']> {
	return (hostname, lookupOptions, callback) => {
		const normalizedOptions = normalizeLookupOptions(lookupOptions);

		let settled = false;

		const settleOnce = (settle: () => void) => {
			if (settled) return;

			settled = true;
			settle();
		};

		const validationOptions: { deadlineAt: number; resolver?: McpOAuthResolver } = { deadlineAt: options.deadlineAt };

		if (options.resolver) {
			validationOptions.resolver = options.resolver;
		}

		validateMcpOAuthHostnameEgress(hostname, validationOptions)
			.then((addresses) => {
				const selected = selectAddresses(addresses, normalizedOptions.family);

				if (selected.length === 0) {
					settleOnce(() => callback(new McpOAuthEgressError('mcp_oauth_dns_empty_result'), ''));
					return;
				}

				if (normalizedOptions.all) {
					settleOnce(() => callback(null, selected as any, undefined as any));
					return;
				}

				const first = selected[0]!;
				settleOnce(() => callback(null, first.address, first.family));
			})
			.catch((error: Error) => {
				settleOnce(() => callback(error, ''));
			});
	};
}

/*
 * Fetch paths validate the hostname immediately before outbound MCP OAuth
 * metadata or JWKS egress. Fresh cached metadata/keys are used without a network lookup.
 */
export async function validateMcpOAuthHostnameEgress(
	hostname: string,
	options: { deadlineAt?: number; resolver?: McpOAuthResolver } = {},
): Promise<ValidatedMcpOAuthAddresses> {
	const bareHostname = hostname.replace(/^\[|\]$/g, '');

	if (isIP(bareHostname)) {
		throw new McpOAuthEgressError('mcp_oauth_dns_ip_literal');
	}

	const deadlineAt = options.deadlineAt ?? performance.now() + DEFAULT_DNS_DEADLINE_MS;
	const resolver = options.resolver ?? defaultResolver;

	if (deadlineAt - performance.now() <= 0) {
		throw new McpOAuthEgressError('mcp_oauth_dns_timeout');
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
async function resolveAndValidate(hostname: string, resolver: McpOAuthResolver): Promise<ValidatedMcpOAuthAddresses> {
	const [addresses4, addresses6] = await Promise.all([
		resolveFamily(() => resolver.resolve4(hostname)),
		resolveFamily(() => resolver.resolve6(hostname)),
	]);

	if (addresses4.length === 0 && addresses6.length === 0) {
		throw new McpOAuthEgressError('mcp_oauth_dns_empty_result');
	}

	for (const address of [...addresses4, ...addresses6]) {
		if (isSpecialUseIp(address)) {
			throw new McpOAuthEgressError('mcp_oauth_dns_special_use_ip');
		}
	}

	return { addresses4, addresses6 };
}

async function resolveFamily(resolve: () => Promise<string[]>): Promise<string[]> {
	try {
		return await resolve();
	} catch (error) {
		if (isEmptyDnsResult(error)) return [];

		throw new McpOAuthEgressError('mcp_oauth_dns_error', { cause: error });
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
		throw new McpOAuthEgressError('mcp_oauth_dns_timeout');
	}

	let timeoutId: NodeJS.Timeout | undefined;

	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => reject(new McpOAuthEgressError('mcp_oauth_dns_timeout')), Math.ceil(remainingMs));
	});

	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
}

function normalizeLookupOptions(options: unknown): {
	all: boolean;
	family: 0 | 4 | 6;
} {
	const lookupOptions = options as { all?: boolean; family?: unknown };

	return {
		all: lookupOptions.all === true,
		family: normalizeFamily(lookupOptions.family),
	};
}

function normalizeFamily(family: unknown): 0 | 4 | 6 {
	if (family === 4 || family === 'IPv4') return 4;
	if (family === 6 || family === 'IPv6') return 6;
	return 0;
}

function selectAddresses(addresses: ValidatedMcpOAuthAddresses, family: 0 | 4 | 6): McpOAuthLookupAddress[] {
	const addresses4 = addresses.addresses4.map((address) => ({ address, family: 4 as const }));
	const addresses6 = addresses.addresses6.map((address) => ({ address, family: 6 as const }));

	if (family === 4) return addresses4;
	if (family === 6) return addresses6;

	return [...addresses4, ...addresses6];
}
