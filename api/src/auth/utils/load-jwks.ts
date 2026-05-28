import { InvalidProviderConfigError } from '@directus/errors';
import { parseJSON } from '@directus/utils';

const ALLOWED_SIG_ALGS = new Set(['PS256', 'ES256']);
const ALLOWED_ENC_ALGS = new Set(['ECDH-ES', 'ECDH-ES+A128KW', 'ECDH-ES+A192KW', 'ECDH-ES+A256KW', 'RSA-OAEP-256']);
const PRIVATE_JWK_MEMBERS = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'k', 'oth'] as const;

export interface JwkSet {
	keys: Record<string, any>[];
}

/**
 * Parse `clientPrivateKeys` from config and split into the artifacts the FAPI driver needs.
 *
 * `clientPrivateKeys` is expected as either a JSON-stringified JWKS-shaped object
 * (`{ "keys": [...] }`) or a JSON array of JWKs. Each JWK must declare `use` (`sig` or `enc`)
 * and a unique `kid`. Signing keys must use PS256 or ES256.
 *
 * Returns:
 *   - `privateJwks`: full JWKS (with private members) — feed to `new issuer.Client(metadata, jwks)`
 *     so openid-client can sign client assertions and decrypt JWE id_tokens.
 *   - `publicJwks`: JWKS with all private members stripped — serve from the public JWKS route.
 *     `jose.exportJWK` does NOT strip private members; we delete them explicitly so a copy-paste
 *     can't ship a private-key JWKS endpoint by accident.
 *   - `hasEncryptionKey`: true if at least one key has `use=enc`. Controls whether the driver
 *     opts into id_token/userinfo JWE decryption — required because openid-client will refuse
 *     plain-JWS tokens once an `*_encrypted_response_alg` is set on the client.
 */
export function loadJwks(
	rawKeys: unknown,
	provider: string,
): {
	privateJwks: JwkSet;
	publicJwks: JwkSet;
	hasEncryptionKey: boolean;
} {
	const parsed = parseRaw(rawKeys, provider);

	let keys = null;

	if (Array.isArray(parsed)) {
		keys = parsed;
	} else if (Array.isArray(parsed?.keys)) {
		keys = parsed.keys;
	}

	if (!keys || keys.length === 0) {
		throw new InvalidProviderConfigError({ provider });
	}

	const seenKids = new Set<string>();
	let hasSigKey = false;
	let hasEncryptionKey = false;

	for (const jwk of keys) {
		if (!jwk || typeof jwk !== 'object') {
			throw new InvalidProviderConfigError({ provider });
		}

		const { kid, use, alg } = jwk;

		if (typeof kid !== 'string' || kid.length === 0 || seenKids.has(kid)) {
			throw new InvalidProviderConfigError({ provider });
		}

		seenKids.add(kid);

		if (use === 'sig') {
			if (typeof alg !== 'string' || !ALLOWED_SIG_ALGS.has(alg)) {
				throw new InvalidProviderConfigError({ provider });
			}

			hasSigKey = true;
		} else if (use === 'enc') {
			if (typeof alg !== 'string' || !ALLOWED_ENC_ALGS.has(alg)) {
				throw new InvalidProviderConfigError({ provider });
			}

			hasEncryptionKey = true;
		} else {
			throw new InvalidProviderConfigError({ provider });
		}
	}

	if (!hasSigKey) {
		throw new InvalidProviderConfigError({ provider });
	}

	const publicKeys = keys.map((jwk: Record<string, any>) => {
		const copy: Record<string, any> = { ...jwk };

		for (const member of PRIVATE_JWK_MEMBERS) {
			delete copy[member];
		}

		return copy;
	});

	return {
		privateJwks: { keys },
		publicJwks: { keys: publicKeys },
		hasEncryptionKey,
	};
}

function parseRaw(rawKeys: unknown, provider: string): any {
	if (rawKeys && typeof rawKeys === 'object') return rawKeys;

	if (typeof rawKeys === 'string') {
		try {
			return parseJSON(rawKeys);
		} catch {
			throw new InvalidProviderConfigError({ provider });
		}
	}

	throw new InvalidProviderConfigError({ provider });
}
