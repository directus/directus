import { randomUUID } from 'crypto';
import { License as Token } from '@directus/license';
import { generateKeyPair } from 'jose';
import { SignJWT } from 'jose/jwt/sign';
import type { License } from './licenses.js';

const { privateKey, publicKey } = await generateKeyPair('EdDSA');

export { publicKey };

export async function createNewToken(license: License) {
	const encodedToken = Token.encode(license.token);

	const now = Math.floor(Date.now() / 1000);

	return new SignJWT(encodedToken)
		.setProtectedHeader({ alg: 'EdDSA', kid: '1234567890' })
		.setIssuer('directus-licensing-service')
		.setIssuedAt(now)
		.setJti(randomUUID())
		.setExpirationTime(license.token.meta.expires_at ?? now + 1000)
		.sign(privateKey);
}
