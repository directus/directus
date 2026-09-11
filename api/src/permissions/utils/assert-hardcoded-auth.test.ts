import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ForbiddenError } from '@directus/errors';
import { HARDCODED_AUTH_REQUIREMENTS } from '@directus/system-data';
import { describe, expect, test } from 'vitest';
import { assertHardcodedAdmin, assertHardcodedUser } from './assert-hardcoded-auth.js';
import { createDefaultAccountability } from './create-default-accountability.js';

const admin = createDefaultAccountability({ user: 'admin-user', admin: true });
const nonAdminUser = createDefaultAccountability({ user: 'regular-user', admin: false });
const anonymous = createDefaultAccountability({ user: null, admin: false });

describe('assertHardcodedAdmin', () => {
	test('passes for an admin', () => {
		expect(() => assertHardcodedAdmin(admin, 'directus_collections', 'create')).not.toThrow();
	});

	test('passes for a system call (null accountability)', () => {
		expect(() => assertHardcodedAdmin(null, 'directus_fields', 'update')).not.toThrow();
	});

	test('throws for a non-admin user', () => {
		expect(() => assertHardcodedAdmin(nonAdminUser, 'directus_relations', 'delete')).toThrow(ForbiddenError);
	});

	test('throws for an anonymous request', () => {
		expect(() => assertHardcodedAdmin(anonymous, 'directus_collections', 'update')).toThrow(ForbiddenError);
	});
});

describe('assertHardcodedUser', () => {
	test('passes for an authenticated user', () => {
		expect(() =>
			assertHardcodedUser(createDefaultAccountability({ user: '123' }), 'directus_comments', 'create'),
		).not.toThrow();
	});

	test.each([
		{ label: 'null accountability (system call)', input: null },
		{ label: 'accountability without a user', input: createDefaultAccountability() },
	])('throws for $label', ({ input }) => {
		expect(() => assertHardcodedUser(input, 'directus_comments', 'update')).toThrow(ForbiddenError);
	});
});

// Drift guard - does not call the helpers. Scans `services/` source and cross-checks the
// `assertHardcoded*(this.accountability, 'collection', 'action')` call sites against
// `HARDCODED_AUTH_REQUIREMENTS`: every table row is enforced by a matching call, and every call
// names a pair that is actually in the table. Enforcement calls must stay single-line with string
// literals for the regex to find them; `directus_extensions` is enforced in its route handlers.
describe('hardcoded auth coverage', () => {
	const servicesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'services');
	const ENFORCED_ELSEWHERE = new Set(['directus_extensions']);
	const CALL_RE = /assertHardcoded(Admin|User)\(this\.accountability, '([^']+)', '([^']+)'\)/g;
	const key = (requiredAuth: string, collection: string, action: string) => `${requiredAuth}:${collection}:${action}`;

	const enforcedPairs = new Set<string>();

	for (const entry of readdirSync(servicesDir, { recursive: true, withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) continue;

		const source = readFileSync(join(entry.parentPath, entry.name), 'utf8');

		for (const [, tier, collection, action] of source.matchAll(CALL_RE)) {
			enforcedPairs.add(key(tier === 'Admin' ? 'admin' : 'user', collection!, action!));
		}
	}

	test.each(HARDCODED_AUTH_REQUIREMENTS)('$requiredAuth $collection/$action is enforced', (requirement) => {
		if (ENFORCED_ELSEWHERE.has(requirement.collection)) return;

		const { requiredAuth, collection, action } = requirement;
		const helper = requiredAuth === 'admin' ? 'assertHardcodedAdmin' : 'assertHardcodedUser';

		expect(
			enforcedPairs.has(key(requiredAuth, collection, action)),
			`${requiredAuth} ${collection}/${action} is in HARDCODED_AUTH_REQUIREMENTS but no service calls ` +
				`${helper}(this.accountability, '${collection}', '${action}'). Add the guard, or add the collection ` +
				`to ENFORCED_ELSEWHERE.`,
		).toBe(true);
	});

	test('every assertHardcoded* call matches a HARDCODED_AUTH_REQUIREMENTS row', () => {
		const rows = new Set(
			HARDCODED_AUTH_REQUIREMENTS.map(({ requiredAuth, collection, action }) => key(requiredAuth, collection, action)),
		);

		for (const pair of enforcedPairs) {
			expect(rows, `assertHardcoded* call for ${pair} does not match any HARDCODED_AUTH_REQUIREMENTS row`).toContain(
				pair,
			);
		}
	});
});
