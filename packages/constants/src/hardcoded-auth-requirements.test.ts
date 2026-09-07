import { describe, expect, it } from 'vitest';
import { HARDCODED_AUTH_REQUIREMENTS } from './hardcoded-auth-requirements.js';

describe('HARDCODED_AUTH_REQUIREMENTS', () => {
	it('has no duplicate collection+action entries', () => {
		const keys = HARDCODED_AUTH_REQUIREMENTS.map((requirement) => `${requirement.collection}:${requirement.action}`);
		expect(new Set(keys).size).toBe(keys.length);
	});
});
