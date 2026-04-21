import type { JWK } from 'jose';

export const LICENSE_FALLBACK_JWK: JWK = {
	crv: 'Ed25519',
	x: 'pvY3LqBAs7Cu9oG7H_PwkG7OsztDYSgPJP29RRgc8lY',
	kty: 'OKP',
	kid: '9c884d23cdb155ca',
	alg: 'EdDSA',
	use: 'sig',
};
