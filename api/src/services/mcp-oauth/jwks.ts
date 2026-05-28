import { useEnv } from '@directus/env';
import {
	decodeProtectedHeader,
	importJWK,
	type JWK,
	type JWTPayload,
	jwtVerify,
	type ProtectedHeaderParameters,
} from 'jose';
import { OAuthError } from './types/error.js';
import { fetchExternalJson } from './utils/external-json.js';
import { JwksUriValidationError, validateJwksUri as validateJwksUriPolicy } from './utils/jwks-uri.js';

const ASSERTION_MAX_BYTES = 16 * 1024;
const JWKS_MAX_BYTES = 32 * 1024;
const JWKS_TIMEOUT_MS = 3_000;
const POSITIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 30 * 1000;
const MAX_COMPATIBLE_KEYS = 8;
const MAX_JWKS_URI_LENGTH = 255;

export const ASSERTION_CLOCK_TOLERANCE_SECONDS = 60;

const MAX_ASSERTION_LIFETIME_SECONDS = 5 * 60;
const PRIVATE_RSA_PARAMETERS = new Set(['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth']);
const BASE64URL_RE = /^[A-Za-z0-9_-]*$/;

export type JwksVerificationFailureReason =
	| 'invalid_assertion'
	| 'invalid_header'
	| 'invalid_claims'
	| 'invalid_jwks_uri'
	| 'jwks_fetch_failed'
	| 'invalid_jwks'
	| 'no_matching_key'
	| 'bad_signature';

export class JwksVerificationError extends OAuthError {
	constructor(public reason: JwksVerificationFailureReason) {
		super(401, 'invalid_client', 'Client authentication failed');
	}
}

export interface VerifyClientAssertionOptions {
	clientId: string;
	jwksUri: string;
	assertion: string;
	acceptedAudiences: string[];
	now?: Date;
}

export interface VerifiedClientAssertion {
	header: ProtectedHeaderParameters;
	payload: JWTPayload;
	claims: {
		iss: string;
		sub: string;
		aud: string | string[];
		jti: string;
		iat?: number;
		exp: number;
		nbf?: number;
	};
}

interface CompatibleJwk {
	jwk: JWK;
	kid?: string;
}

interface PositiveCacheEntry {
	expiresAt: number;
	keys: CompatibleJwk[];
}

const positiveCache = new Map<string, PositiveCacheEntry>();
const negativeFetchCache = new Map<string, number>();
const unknownKeyNegativeCache = new Map<string, number>();
const inFlightFetches = new Map<string, Promise<CompatibleJwk[]>>();

export function __clearJwksCachesForTests(): void {
	positiveCache.clear();
	negativeFetchCache.clear();
	unknownKeyNegativeCache.clear();
	inFlightFetches.clear();
}

export async function verifyClientAssertion(options: VerifyClientAssertionOptions): Promise<VerifiedClientAssertion> {
	const now = options.now ?? new Date();
	const header = validateAssertionHeader(options.assertion);

	let keys = await getJwks(options.jwksUri, options.clientId, now, false);
	let selected = selectVerificationKey(keys, header);

	// A missing kid can simply mean the client rotated its JWKS after our last successful fetch.
	// Refresh once before failing, then briefly negative-cache misses so bad assertions cannot force refetch loops.
	if (selected.status === 'no_match') {
		if (!isNegativeCacheActive(unknownKeyNegativeCache, options.jwksUri, now)) {
			try {
				keys = await getJwks(options.jwksUri, options.clientId, now, true);
				selected = selectVerificationKey(keys, header);
			} catch (err) {
				if (err instanceof JwksVerificationError) throw err;
				throw new JwksVerificationError('jwks_fetch_failed');
			}

			if (selected.status === 'no_match') {
				unknownKeyNegativeCache.set(options.jwksUri, now.getTime() + NEGATIVE_CACHE_TTL_MS);
			}
		}
	}

	if (selected.status !== 'selected') {
		throw new JwksVerificationError('no_matching_key');
	}

	try {
		const key = await importJWK(selected.key.jwk, 'RS256');

		const { payload, protectedHeader } = await jwtVerify(options.assertion, key, {
			algorithms: ['RS256'],
			audience: options.acceptedAudiences,
			issuer: options.clientId,
			subject: options.clientId,
			currentDate: now,
			clockTolerance: ASSERTION_CLOCK_TOLERANCE_SECONDS,
		});

		const claims = validatePayloadClaims(payload, options.clientId, now);

		return { header: protectedHeader, payload, claims };
	} catch (err) {
		if (err instanceof JwksVerificationError) throw err;
		throw new JwksVerificationError('bad_signature');
	}
}

function validateAssertionHeader(assertion: string): ProtectedHeaderParameters {
	// Bound assertion size before decoding so malformed requests cannot spend unbounded CPU/memory in JOSE parsing.
	if (typeof assertion !== 'string' || Buffer.byteLength(assertion, 'utf8') > ASSERTION_MAX_BYTES) {
		throw new JwksVerificationError('invalid_assertion');
	}

	if (assertion.split('.').length !== 3) {
		throw new JwksVerificationError('invalid_assertion');
	}

	let header: ProtectedHeaderParameters;

	try {
		header = decodeProtectedHeader(assertion);
	} catch {
		throw new JwksVerificationError('invalid_header');
	}

	if (header.alg !== 'RS256') {
		throw new JwksVerificationError('invalid_header');
	}

	// We only accept a plain signed client assertion. Headers that point at attacker-controlled key material,
	// embed keys/certificates, or introduce critical/encryption semantics are outside this verifier's trust model.
	if (header.typ !== undefined && header.typ !== 'JWT' && header.typ !== 'client-authentication+jwt') {
		throw new JwksVerificationError('invalid_header');
	}

	if (
		header.crit !== undefined ||
		header.cty !== undefined ||
		hasOwn(header, 'jku') ||
		hasOwn(header, 'x5u') ||
		hasOwn(header, 'jwk') ||
		hasOwn(header, 'x5c') ||
		hasOwn(header, 'enc')
	) {
		throw new JwksVerificationError('invalid_header');
	}

	if (header.kid !== undefined && typeof header.kid !== 'string') {
		throw new JwksVerificationError('invalid_header');
	}

	return header;
}

function validatePayloadClaims(payload: JWTPayload, clientId: string, now: Date): VerifiedClientAssertion['claims'] {
	// RFC 7523 client authentication identifies the client with both iss and sub; requiring both to match avoids
	// accepting an assertion minted by one subject for another client_id.
	if (payload.iss !== clientId || payload.sub !== clientId) {
		throw new JwksVerificationError('invalid_claims');
	}

	if (!isStringOrStringArray(payload.aud)) {
		throw new JwksVerificationError('invalid_claims');
	}

	const iat = payload.iat;
	const exp = payload.exp;

	if (!Number.isFinite(exp)) {
		throw new JwksVerificationError('invalid_claims');
	}

	const expiresAt = exp as number;
	const nowSeconds = Math.floor(now.getTime() / 1000);

	if (payload.nbf !== undefined && !Number.isFinite(payload.nbf)) {
		throw new JwksVerificationError('invalid_claims');
	}

	if (typeof payload.jti !== 'string' || payload.jti.length === 0 || payload.jti.length > 255) {
		throw new JwksVerificationError('invalid_claims');
	}

	// Keep assertions short-lived so replay markers only need to be retained for a bounded window.
	let issuedAt: number | undefined;

	if (iat !== undefined) {
		if (!Number.isFinite(iat)) {
			throw new JwksVerificationError('invalid_claims');
		}

		issuedAt = iat as number;

		if (expiresAt - issuedAt > MAX_ASSERTION_LIFETIME_SECONDS) {
			throw new JwksVerificationError('invalid_claims');
		}

		if (issuedAt > nowSeconds + ASSERTION_CLOCK_TOLERANCE_SECONDS) {
			throw new JwksVerificationError('invalid_claims');
		}
	} else if (expiresAt > nowSeconds + MAX_ASSERTION_LIFETIME_SECONDS + ASSERTION_CLOCK_TOLERANCE_SECONDS) {
		throw new JwksVerificationError('invalid_claims');
	}

	return {
		iss: payload.iss,
		sub: payload.sub,
		aud: payload.aud,
		jti: payload.jti,
		exp: expiresAt,
		...(issuedAt !== undefined && { iat: issuedAt }),
		...(payload.nbf !== undefined && { nbf: payload.nbf }),
	};
}

function isStringOrStringArray(value: unknown): value is string | string[] {
	return typeof value === 'string' || (Array.isArray(value) && value.every((entry) => typeof entry === 'string'));
}

async function getJwks(jwksUri: string, clientId: string, now: Date, forceRefresh: boolean): Promise<CompatibleJwk[]> {
	// Stored metadata is revalidated at use time so older rows cannot bypass stricter runtime JWKS policy.
	validateJwksUri(jwksUri, clientId);
	pruneExpiredCacheEntries(now);

	const cached = positiveCache.get(jwksUri);

	if (!forceRefresh && cached && cached.expiresAt > now.getTime()) {
		return cached.keys;
	}

	if (isNegativeCacheActive(negativeFetchCache, jwksUri, now)) {
		throw new JwksVerificationError('jwks_fetch_failed');
	}

	const inFlight = inFlightFetches.get(jwksUri);
	if (inFlight) return await inFlight;

	// Collapse concurrent JWKS misses for the same URI into one network request.
	const fetchPromise = fetchAndValidateJwks(jwksUri)
		.then((keys) => {
			positiveCache.set(jwksUri, { keys, expiresAt: now.getTime() + POSITIVE_CACHE_TTL_MS });
			negativeFetchCache.delete(jwksUri);
			return keys;
		})
		.catch((err) => {
			negativeFetchCache.set(jwksUri, now.getTime() + NEGATIVE_CACHE_TTL_MS);

			if (err instanceof JwksVerificationError) throw err;
			throw new JwksVerificationError('jwks_fetch_failed');
		})
		.finally(() => {
			inFlightFetches.delete(jwksUri);
		});

	inFlightFetches.set(jwksUri, fetchPromise);

	return await fetchPromise;
}

async function fetchAndValidateJwks(jwksUri: string): Promise<CompatibleJwk[]> {
	let response;

	try {
		// private_key_jwt trusts this document as public key material, so it stays HTTPS-only even when HTTP CIMD
		// is enabled for local/public-client development.
		response = await fetchExternalJson<unknown>(jwksUri, {
			maxBytes: JWKS_MAX_BYTES,
			timeoutMs: JWKS_TIMEOUT_MS,
			allowHttp: false,
			allowLoopbackForLocalDevelopment: false,
			redactionContext: 'MCP OAuth JWKS',
		});
	} catch {
		throw new JwksVerificationError('jwks_fetch_failed');
	}

	if (response.status !== 200) {
		throw new JwksVerificationError('jwks_fetch_failed');
	}

	return validateJwks(response.data);
}

function validateJwks(value: unknown): CompatibleJwk[] {
	if (!value || typeof value !== 'object' || !Array.isArray((value as { keys?: unknown }).keys)) {
		throw new JwksVerificationError('invalid_jwks');
	}

	// Ignore incompatible keys but reject malformed compatible-looking keys. This lets clients publish mixed-use
	// JWKS documents while still applying strict checks to keys we might actually use for assertions.
	const keys = (value as { keys: unknown[] }).keys.flatMap((key) => {
		if (!isCompatibleJwkCandidate(key)) return [];
		return [validateCompatibleJwk(key)];
	});

	// A small cap keeps key selection bounded for attacker-controlled JWKS documents.
	if (keys.length > MAX_COMPATIBLE_KEYS) {
		throw new JwksVerificationError('invalid_jwks');
	}

	return keys;
}

function isCompatibleJwkCandidate(value: unknown): value is JWK {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

	const jwk = value as JWK;

	if (jwk.kty !== 'RSA') return false;
	if (jwk.alg !== undefined && jwk.alg !== 'RS256') return false;
	if (jwk.use !== undefined && jwk.use !== 'sig') return false;
	if (!hasCompatibleKeyOps(jwk.key_ops)) return false;

	return true;
}

function hasCompatibleKeyOps(keyOps: JWK['key_ops']): boolean {
	if (keyOps === undefined) return true;

	// If a key declares operations, accept only a key that is explicitly and exclusively usable for verification.
	if (!Array.isArray(keyOps) || keyOps.some((operation) => typeof operation !== 'string')) {
		throw new JwksVerificationError('invalid_jwks');
	}

	const uniqueOperations = new Set(keyOps);

	if (uniqueOperations.size !== keyOps.length) {
		throw new JwksVerificationError('invalid_jwks');
	}

	if (!uniqueOperations.has('verify')) return false;

	if (uniqueOperations.size !== 1) {
		throw new JwksVerificationError('invalid_jwks');
	}

	return true;
}

function validateCompatibleJwk(value: unknown): CompatibleJwk {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new JwksVerificationError('invalid_jwks');
	}

	const jwk = value as JWK;

	if (jwk.kty !== 'RSA' || typeof jwk.n !== 'string' || typeof jwk.e !== 'string') {
		throw new JwksVerificationError('invalid_jwks');
	}

	for (const parameter of PRIVATE_RSA_PARAMETERS) {
		if (hasOwn(jwk, parameter)) {
			throw new JwksVerificationError('invalid_jwks');
		}
	}

	// RS256 is the only advertised signing algorithm for this feature, so RSA keys are constrained to a
	// conservative public-key shape before jose imports them.
	if (rsaModulusBits(jwk.n) < 2048) {
		throw new JwksVerificationError('invalid_jwks');
	}

	if (jwk.e !== 'AQAB') {
		throw new JwksVerificationError('invalid_jwks');
	}

	if (jwk.kid !== undefined && typeof jwk.kid !== 'string') {
		throw new JwksVerificationError('invalid_jwks');
	}

	return { jwk, ...(typeof jwk.kid === 'string' && { kid: jwk.kid }) };
}

function rsaModulusBits(modulus: string): number {
	const bytes = decodeBase64Url(modulus);
	let offset = 0;

	while (offset < bytes.length && bytes[offset] === 0) {
		offset++;
	}

	if (offset === bytes.length) return 0;

	const firstByte = bytes[offset]!;
	const leadingBits = 8 - Math.clz32(firstByte) + 24;

	return leadingBits + (bytes.length - offset - 1) * 8;
}

function decodeBase64Url(value: string): Buffer {
	if (!BASE64URL_RE.test(value) || value.length % 4 === 1) {
		throw new JwksVerificationError('invalid_jwks');
	}

	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const bytes = Buffer.from(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='), 'base64');

	// Re-encoding catches non-canonical encodings; leading zero octets would let the same modulus have multiple
	// textual representations, so reject those too.
	if (bytes.toString('base64url') !== value || (bytes.length > 1 && bytes[0] === 0)) {
		throw new JwksVerificationError('invalid_jwks');
	}

	return bytes;
}

type KeySelectionResult = { status: 'selected'; key: CompatibleJwk } | { status: 'no_match' } | { status: 'ambiguous' };

function selectVerificationKey(keys: CompatibleJwk[], header: ProtectedHeaderParameters): KeySelectionResult {
	if (typeof header.kid === 'string') {
		const matches = keys.filter((key) => key.kid === header.kid);

		if (matches.length === 1) return { status: 'selected', key: matches[0]! };
		if (matches.length > 1) return { status: 'ambiguous' };

		return { status: 'no_match' };
	}

	if (keys.length === 1) return { status: 'selected', key: keys[0]! };
	if (keys.length === 0) return { status: 'no_match' };

	// Without kid, multiple compatible keys are ambiguous. Guessing would make verification depend on JWKS order.
	return { status: 'ambiguous' };
}

function validateJwksUri(jwksUri: string, clientId: string): void {
	const env = useEnv();

	try {
		validateJwksUriPolicy(jwksUri, clientId, {
			allowedDomains:
				(env['MCP_OAUTH_CIMD_ALLOWED_DOMAINS'] as string[] | undefined)?.filter((domain) => domain !== '') ?? [],
			maxLength: MAX_JWKS_URI_LENGTH,
		});
	} catch (err) {
		if (err instanceof JwksUriValidationError) {
			throw new JwksVerificationError('invalid_jwks_uri');
		}

		throw err;
	}
}

function pruneExpiredCacheEntries(now: Date): void {
	const nowMs = now.getTime();

	for (const [jwksUri, entry] of positiveCache) {
		if (entry.expiresAt <= nowMs) {
			positiveCache.delete(jwksUri);
		}
	}

	pruneExpiredNegativeCacheEntries(negativeFetchCache, nowMs);
	pruneExpiredNegativeCacheEntries(unknownKeyNegativeCache, nowMs);
}

function pruneExpiredNegativeCacheEntries(cache: Map<string, number>, nowMs: number): void {
	for (const [key, expiresAt] of cache) {
		if (expiresAt <= nowMs) {
			cache.delete(key);
		}
	}
}

function isNegativeCacheActive(cache: Map<string, number>, key: string, now: Date): boolean {
	const expiresAt = cache.get(key);

	if (!expiresAt) return false;

	if (expiresAt <= now.getTime()) {
		cache.delete(key);
		return false;
	}

	return true;
}

function hasOwn(value: object, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(value, key);
}
