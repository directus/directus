import { InvalidLicenseTokenError } from '@directus/errors';
import { decodeJwt, decodeProtectedHeader, importJWK, type JWK, jwtVerify } from 'jose';
import { LICENSE_FALLBACK_JWK } from '../license/fallback-jwk.js';
import { isTransientLicenseError } from '../license/handle-api-error.js';
import { getLicenseClient } from '../license/request.js';
import type { LicenseTokenPayload } from '../license/types.js';

let cachedJwks: JWK[] | null = null;

type VerifyOptions = {
	mode?: 'local' | 'remote';
	currentDate?: Date;
};

export class LicenseVerificationUnavailableError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'LicenseVerificationUnavailableError';
	}
}

export function isLicenseVerificationUnavailableError(error: unknown): error is LicenseVerificationUnavailableError {
	return error instanceof LicenseVerificationUnavailableError;
}

async function fetchJwks(): Promise<JWK[]> {
	const response = await getLicenseClient().get<{ keys?: JWK[] }>('/.well-known/jwks.json');
	const body = response.data;

	if (!Array.isArray(body.keys) || body.keys.length === 0) {
		throw new Error('Licensing service returned an empty JWKS set');
	}

	cachedJwks = body.keys;
	return body.keys;
}

async function verifyWithJwks(token: string, keys: JWK[], currentDate?: Date): Promise<LicenseTokenPayload | null> {
	const protectedHeader = decodeProtectedHeader(token);
	const key = keys.find((candidate) => candidate.kid === protectedHeader.kid);

	if (!key) return null;

	const cryptoKey = await importJWK(key, key.alg ?? 'EdDSA');

	const { payload } = await jwtVerify(token, cryptoKey, {
		algorithms: ['EdDSA'],
		issuer: 'directus-licensing-service',
		audience: 'directus',
		...(currentDate ? { currentDate } : {}),
	});

	return payload as LicenseTokenPayload;
}

async function verifyWithLocalFallback(token: string, currentDate?: Date): Promise<LicenseTokenPayload> {
	const payload = await verifyWithJwks(token, [LICENSE_FALLBACK_JWK], currentDate);

	if (!payload) {
		throw new InvalidLicenseTokenError({ reason: 'Token kid did not match the local fallback JWK' });
	}

	return payload;
}

async function _verify(token: string, options?: VerifyOptions): Promise<LicenseTokenPayload> {
	let remoteUnavailable = false;

	if (options?.mode !== 'local') {
		try {
			const freshKeys = await fetchJwks();
			const freshPayload = await verifyWithJwks(token, freshKeys, options?.currentDate);
			if (freshPayload) return freshPayload;
		} catch (error) {
			if (isTransientLicenseError(error)) {
				remoteUnavailable = true;
			} else {
				throw error;
			}
		}
	}

	if (cachedJwks) {
		const cachedPayload = await verifyWithJwks(token, cachedJwks, options?.currentDate);
		if (cachedPayload) return cachedPayload;
	}

	try {
		return await verifyWithLocalFallback(token, options?.currentDate);
	} catch (error) {
		if (remoteUnavailable && error instanceof InvalidLicenseTokenError) {
			throw new LicenseVerificationUnavailableError('Authoritative license verification is unavailable', {
				cause: error,
			});
		}

		throw error;
	}
}

export async function verify(token: string, options?: VerifyOptions): Promise<LicenseTokenPayload> {
	return await _verify(token, options);
}

export async function verifyLocallyWithinGrace(token: string): Promise<LicenseTokenPayload> {
	let decoded: Partial<LicenseTokenPayload>;

	try {
		decoded = decodeJwt(token) as Partial<LicenseTokenPayload>;
	} catch (error) {
		throw new InvalidLicenseTokenError({}, { cause: error });
	}

	const exp = decoded.exp;

	if (typeof exp !== 'number' || Number.isNaN(exp)) {
		throw new InvalidLicenseTokenError({ reason: 'Token is missing a valid exp claim' });
	}

	const rawGracePeriod =
		decoded.metadata && typeof decoded.metadata === 'object' ? decoded.metadata.grace_period : undefined;

	const gracePeriod =
		typeof rawGracePeriod === 'number' && Number.isFinite(rawGracePeriod) ? Math.max(rawGracePeriod, 0) : 0;

	if (Date.now() > exp * 1000 + gracePeriod * 1000) {
		throw new InvalidLicenseTokenError({ reason: 'Token is outside the local grace window' });
	}

	return await _verify(token, {
		mode: 'local',
		currentDate: new Date(Math.max(exp * 1000 - 1000, 0)),
	});
}
