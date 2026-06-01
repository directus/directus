import {
	lookup as dnsLookup,
	type LookupAddress as DnsLookupAddress,
	promises as dnsPromises,
	type LookupOneOptions,
} from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import type { Readable } from 'node:stream';
import type { AxiosRequestConfig } from 'axios';
import axios, { isAxiosError } from 'axios';
import { OAuthError } from '../types/error.js';
import { isLoopbackIp, isSpecialUseIp, normalizeHostname } from './egress-policy.js';

const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_MAX_BYTES = 5_120;
const CONTENT_TYPE_JSON_RE = /^application\/(?:json|[\w.-]+\+json)(?:\s*;|$)/i;

export type ExternalJsonResult<T> =
	| { status: 200; data: T; etag: string | null; cacheControl: string | undefined; expires: string | undefined }
	| { status: 304; etag: string | null; cacheControl: string | undefined; expires: string | undefined };

export interface FetchExternalJsonOptions {
	headers?: Record<string, string>;
	maxBytes?: number;
	timeoutMs?: number;
	allowHttp?: boolean;
	allowLoopbackForLocalDevelopment?: boolean;
	allowNotModified?: boolean;
	lookup?: NonNullable<http.AgentOptions['lookup']>;
	redactionContext?: string;
}

/**
 * Converts egress failures into OAuth client metadata errors so callers do not leak low-level network details.
 */
function externalJsonError(options: FetchExternalJsonOptions, description = 'Failed to fetch external JSON document') {
	const context = options.redactionContext ? `${options.redactionContext}: ` : '';

	return new OAuthError(400, 'invalid_client_metadata', `${context}${description}`);
}

/**
 * Applies the shared SSRF egress policy to a resolved address.
 */
function isAllowedAddress(address: string, options: FetchExternalJsonOptions): boolean {
	if (!isSpecialUseIp(address)) return true;

	// Loopback is only useful for local development metadata fixtures. Callers that fetch trusted key material
	// can leave allowLoopbackForLocalDevelopment false even if they permit HTTP elsewhere.
	return Boolean(options.allowHttp && options.allowLoopbackForLocalDevelopment && isLoopbackIp(address));
}

/**
 * Throws a caller-safe OAuth error when a resolved address is outside the allowed egress policy.
 */
function assertAllowedAddress(address: string, options: FetchExternalJsonOptions): void {
	if (!isAllowedAddress(address, options)) {
		throw externalJsonError(options, 'Resolved address is not allowed');
	}
}

/**
 * Validates the caller-provided URL before DNS or HTTP work so rejected inputs never trigger outbound traffic.
 */
function validateUrl(input: string, options: FetchExternalJsonOptions): URL {
	let url: URL;

	try {
		url = new URL(input);
	} catch {
		throw externalJsonError(options, 'URL is invalid');
	}

	if (url.protocol !== 'https:' && !(options.allowHttp && url.protocol === 'http:')) {
		throw externalJsonError(options, 'URL must use HTTPS');
	}

	if (!url.hostname) {
		throw externalJsonError(options, 'URL host is required');
	}

	if (url.username || url.password) {
		throw externalJsonError(options, 'URL must not include credentials');
	}

	if (input.includes('#')) {
		throw externalJsonError(options, 'URL must not include a fragment');
	}

	const hostname = normalizeHostname(url.hostname);

	// IP literals bypass DNS, so apply the same egress policy before any request is attempted.
	if (isIP(hostname) !== 0) {
		assertAllowedAddress(hostname, options);
	}

	return url;
}

/**
 * Preflights every DNS answer for the host before opening a socket.
 */
async function resolveHost(hostname: string, options: FetchExternalJsonOptions): Promise<void> {
	const normalizedHostname = normalizeHostname(hostname);

	if (isIP(normalizedHostname) !== 0) return;

	let addresses: DnsLookupAddress[];

	try {
		addresses = await dnsPromises.lookup(normalizedHostname, { all: true, verbatim: true });
	} catch {
		throw externalJsonError(options, 'Host could not be resolved');
	}

	if (addresses.length === 0) {
		throw externalJsonError(options, 'Host could not be resolved');
	}

	// Preflight all resolved addresses because an attacker-controlled hostname can publish both public and private
	// answers; one blocked answer is enough to reject the request.
	for (const { address } of addresses) {
		assertAllowedAddress(address, options);
	}
}

/**
 * Builds a socket-time DNS lookup that repeats the egress policy check after preflight resolution.
 */
function createLookup(options: FetchExternalJsonOptions): NonNullable<http.AgentOptions['lookup']> {
	// Node resolves again while opening the socket. Re-checking the connect-time answer closes the DNS rebinding
	// gap between preflight resolution and the actual outbound connection.
	return (hostname, lookupOptions, callback) => {
		dnsLookup(hostname, lookupOptions as LookupOneOptions, (error, address, family) => {
			if (error) {
				callback(error, address, family);
				return;
			}

			try {
				if (Array.isArray(address)) {
					for (const entry of address) {
						assertAllowedAddress(entry.address, options);
					}
				} else {
					assertAllowedAddress(address, options);
				}
			} catch (err) {
				callback(err as NodeJS.ErrnoException, address as any, family as any);
				return;
			}

			if (Array.isArray(address) || (lookupOptions as { all?: boolean }).all !== true) {
				callback(null, address as any, family as any);
				return;
			}

			callback(null, [{ address, family }] as any, family as any);
		});
	};
}

/**
 * Produces the timeout-specific OAuth error used by both request and stream abort paths.
 */
function abortError(options: FetchExternalJsonOptions): OAuthError {
	return externalJsonError(options, 'External JSON fetch timed out');
}

/**
 * Races work that does not natively observe AbortSignal against the request timeout.
 */
async function withAbort<T>(promise: Promise<T>, signal: AbortSignal, options: FetchExternalJsonOptions): Promise<T> {
	if (signal.aborted) {
		throw abortError(options);
	}

	return await Promise.race([
		promise,
		new Promise<never>((_resolve, reject) => {
			signal.addEventListener('abort', () => reject(abortError(options)), { once: true });
		}),
	]);
}

/**
 * Reads a streaming response with byte and timeout enforcement before JSON parsing.
 */
async function readResponseBody(
	stream: Readable,
	maxBytes: number,
	options: FetchExternalJsonOptions,
	signal: AbortSignal,
): Promise<string> {
	let bytes = 0;
	const chunks: Buffer[] = [];
	const abort = () => stream.destroy(abortError(options));

	if (signal.aborted) {
		abort();
	}

	signal.addEventListener('abort', abort, { once: true });

	try {
		for await (const chunk of stream) {
			const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			bytes += buffer.byteLength;

			// Count bytes while streaming so a large response is stopped before it is buffered or parsed.
			if (bytes > maxBytes) {
				stream.destroy();
				throw externalJsonError(options, 'External JSON response exceeded the maximum allowed size');
			}

			chunks.push(buffer);
		}
	} catch (err) {
		if (err instanceof OAuthError) throw err;
		throw externalJsonError(options);
	} finally {
		signal.removeEventListener('abort', abort);
	}

	return Buffer.concat(chunks).toString('utf8');
}

/**
 * Normalizes Axios header values to the single string form used in OAuth metadata caching.
 */
function headerValue(headers: Record<string, unknown>, header: string): string | undefined {
	const value = headers[header];

	if (Array.isArray(value)) return value[0];
	if (typeof value === 'string') return value;

	return undefined;
}

/**
 * Fetches a JSON metadata document with the egress constraints required for untrusted OAuth client metadata.
 */
export async function fetchExternalJson<T = unknown>(
	input: string,
	options: FetchExternalJsonOptions = {},
): Promise<ExternalJsonResult<T>> {
	const url = validateUrl(input, options);
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const abortController = new AbortController();
	const timeout = setTimeout(() => abortController.abort(), timeoutMs);
	let httpAgent: http.Agent | undefined;
	let httpsAgent: https.Agent | undefined;

	try {
		await withAbort(resolveHost(url.hostname, options), abortController.signal, options);

		const lookup = options.lookup ?? createLookup(options);
		httpAgent = new http.Agent({ lookup });
		httpsAgent = new https.Agent({ lookup });

		// Do not follow redirects or proxy through ambient environment config. The URL was validated for one
		// origin and one resolved address set; redirects/proxies would create a second, unvalidated egress target.
		const requestConfig: AxiosRequestConfig = {
			httpAgent,
			httpsAgent,
			maxRedirects: 0,
			proxy: false,
			responseType: 'stream',
			signal: abortController.signal,
			timeout: timeoutMs,
			validateStatus: (status) => status === 200 || Boolean(options.allowNotModified && status === 304),
		};

		if (options.headers) requestConfig.headers = options.headers;

		const response = await axios.get(url.href, requestConfig);

		const headers = response.headers as Record<string, unknown>;
		const etag = headerValue(headers, 'etag') ?? null;
		const cacheControl = headerValue(headers, 'cache-control');
		const expires = headerValue(headers, 'expires');

		if (response.status === 304) {
			return { status: 304, etag, cacheControl, expires };
		}

		const contentType = headerValue(headers, 'content-type');

		if (!contentType || !CONTENT_TYPE_JSON_RE.test(contentType)) {
			throw externalJsonError(options, 'External JSON response must use a JSON content type');
		}

		const body = await readResponseBody(
			response.data as Readable,
			options.maxBytes ?? DEFAULT_MAX_BYTES,
			options,
			abortController.signal,
		);

		try {
			return { status: 200, data: JSON.parse(body) as T, etag, cacheControl, expires };
		} catch {
			throw externalJsonError(options, 'External JSON response body could not be parsed');
		}
	} catch (err) {
		if (err instanceof OAuthError) throw err;

		if (isAxiosError(err) && err.response?.data && typeof err.response.data.destroy === 'function') {
			err.response.data.destroy();
		}

		throw externalJsonError(options);
	} finally {
		clearTimeout(timeout);
		httpAgent?.destroy();
		httpsAgent?.destroy();
	}
}
