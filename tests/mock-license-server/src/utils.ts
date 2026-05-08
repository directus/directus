import { randomUUID } from 'crypto';
import { License } from '@directus/license';
import type { DeepPartial } from '@directus/types';
import { generateKeyPair } from 'jose';
import { SignJWT } from 'jose/jwt/sign';
import { merge } from 'lodash-es';
import type { MockLicense } from './types.js';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// random key based on this format: DXXXX-XXXXX-XXXXX-XXXXX-XXXXC
// where D is a constant
// where X is based on the alphabet
// where C is checksum of all Xes based on luhnChecksum
function luhnChecksum(payload: string): string {
	let sum = 0;

	for (let i = 0; i < payload.length; i++) {
		const char = payload.at(-(1 + i)) as string;
		const value = ALPHABET.indexOf(char);
		const position = i + 1; // 1-indexed from the right of the payload

		if (position % 2 !== 0) {
			let doubled = value * 2;
			if (doubled >= 32) doubled -= 31;
			sum += doubled;
		} else {
			sum += value;
		}
	}

	const remainder = sum % 32;
	const expectedChecksumChar = ALPHABET[(32 - remainder) % 32] as string;

	return expectedChecksumChar;
}

export function generateKey() {
	const c = Array.from({ length: 23 }, () => Math.floor(Math.random() * ALPHABET.length))
		.map((i) => ALPHABET[i])
		.join('');

	return `D${c.slice(0, 4)}-${c.slice(4, 9)}-${c.slice(9, 14)}-${c.slice(14, 19)}-${c.slice(19, 23) + luhnChecksum(c)}`;
}

export function createLicense(overrides?: DeepPartial<MockLicense>): MockLicense {
	const key = generateKey();
	const now = Math.floor(Date.now() / 1000);

	return merge(
		{
			key,
			max_projects: 10,
			projects: [],
			addons: [],
			name: `mock-${key}`,
			meta: {
				name: 'TEAM',
				version: '2026-05-08',
				grace_period: 10_000,
				validation_interval: 1000,
				expires_at: now + 100_000,
				offline: false,
			},
			entitlements: {
				collections: { limit: 100 },
				seats: { limit: 100 },
				activity_historical_timeframe: { limit: 2_592_000 },
				revision_historical_timeframe: { limit: 2_582_000 },
				sso_enabled: { default: true },
				offline_enabled: { default: false },
				telemetry_required: { default: false },
				display_powered_by: 'NONE',
				custom_llms_enabled: { default: true },
				custom_permission_rules_enabled: { default: true },
				ai_translations_enabled: { default: true },
				production_enabled: { default: true },
				flows: { limit: 100 },
			},
		},
		overrides,
	);
}

const { privateKey, publicKey } = await generateKeyPair('EdDSA');

export { publicKey };

export async function createNewToken(license: License) {
	const encodedToken = License.encode({ entitlements: license.entitlements, meta: license.meta });

	const now = Math.floor(Date.now() / 1000);

	return new SignJWT(encodedToken)
		.setProtectedHeader({ alg: 'EdDSA' })
		.setIssuer('directus-licensing-service')
		.setIssuedAt(now)
		.setJti(randomUUID())
		.setExpirationTime(license.meta.expires_at ?? now + 1000)
		.sign(privateKey);
}
