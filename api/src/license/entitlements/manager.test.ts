import { LimitExceededError, ResourceRestrictedError } from '@directus/errors';
import { type Directus, DIRECTUS_CORE_LICENSE } from '@directus/license';
import type { Knex } from 'knex';
import { merge } from 'lodash-es';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { checkCustomLLM } from './lib/custom-llms-enabled.js';
import { countActiveFlows } from './lib/flows.js';
import { EntitlementManager } from './manager.js';

vi.mock('../../bus/index.js', () => ({ useBus: () => ({ publish: vi.fn(), subscribe: vi.fn() }) }));
vi.mock('./lib/collections.js', () => ({ countActiveCollections: vi.fn(), resolveCollections: vi.fn() }));
vi.mock('./lib/flows.js', () => ({ countActiveFlows: vi.fn(), resolveFlows: vi.fn() }));
vi.mock('./lib/seats.js', () => ({ countActiveSeats: vi.fn(), resolveSeats: vi.fn() }));
vi.mock('./lib/custom-llms-enabled.js', () => ({ checkCustomLLM: vi.fn() }));
vi.mock('./lib/custom-permission-rules-enabled.js', () => ({ checkCustomPermissionRules: vi.fn() }));
vi.mock('./lib/sso-enabled.js', () => ({ checkUsersSSO: vi.fn(), resolveSSOUsers: vi.fn() }));

afterEach(() => {
	vi.clearAllMocks();
});

function managerWith(entitlements: Partial<Record<keyof Directus.Entitlements, unknown>>) {
	const manager = new EntitlementManager();
	manager.setEntitlements(merge({}, DIRECTUS_CORE_LICENSE.entitlements, entitlements));
	return manager;
}

describe('getEntitlementLimit', () => {
	test('adds overage and addon quantities to the base limit', () => {
		expect(managerWith({ flows: { limit: 1, overage: 2, addon: 3 } }).getEntitlementLimit('flows')).toBe(6);
	});

	test.each([
		['limit', { limit: -1, overage: 2, addon: 3 }],
		['overage', { limit: 1, overage: -1, addon: 3 }],
		['addon', { limit: 1, overage: 2, addon: -1 }],
	])('an unlimited %s makes the whole entitlement unlimited', (_, flows) => {
		expect(managerWith({ flows }).getEntitlementLimit('flows')).toBe(-1);
	});
});

describe('assert (countable)', () => {
	test('allows adding up to the limit', async () => {
		vi.mocked(countActiveFlows).mockResolvedValue(0);

		await expect(managerWith({ flows: { limit: 1 } }).assert('flows', { adding: 1 })).resolves.toBeUndefined();
	});

	test('throws LimitExceededError when adding would go past the limit', async () => {
		vi.mocked(countActiveFlows).mockResolvedValue(1);

		await expect(managerWith({ flows: { limit: 1 } }).assert('flows', { adding: 1 })).rejects.toBeInstanceOf(
			LimitExceededError,
		);
	});

	test('an unlimited entitlement never throws, whatever the usage', async () => {
		vi.mocked(countActiveFlows).mockResolvedValue(1_000);

		await expect(managerWith({ flows: { limit: -1 } }).assert('flows', { adding: 1 })).resolves.toBeUndefined();
	});
});

describe('usage cache', () => {
	test('a cleared key is recounted, so freed capacity is visible on the next assert', async () => {
		const manager = managerWith({ flows: { limit: 1 } });

		vi.mocked(countActiveFlows).mockResolvedValue(1);
		await expect(manager.assert('flows', { adding: 1 })).rejects.toBeInstanceOf(LimitExceededError);

		vi.mocked(countActiveFlows).mockResolvedValue(0);
		await expect(manager.assert('flows', { adding: 1 })).rejects.toBeInstanceOf(LimitExceededError);

		await manager.clearCache('flows');
		await expect(manager.assert('flows', { adding: 1 })).resolves.toBeUndefined();
	});

	test('a transaction bypasses the cache and counts inside it', async () => {
		const manager = managerWith({ flows: { limit: 1 } });

		vi.mocked(countActiveFlows).mockResolvedValue(1);
		await manager.getUsage('flows');

		const trx = { isTransaction: true } as Knex.Transaction;
		vi.mocked(countActiveFlows).mockResolvedValue(0);

		await expect(manager.assert('flows', { adding: 1, knex: trx })).resolves.toBeUndefined();
		expect(countActiveFlows).toHaveBeenLastCalledWith({ knex: trx });
	});
});

describe('assert (feature flag)', () => {
	test('an entitled feature is allowed without running its validator', async () => {
		await expect(
			managerWith({ custom_llms_enabled: { default: true } }).assert('custom_llms_enabled'),
		).resolves.toBeUndefined();

		expect(checkCustomLLM).not.toHaveBeenCalled();
	});

	test('an override takes precedence over the default', async () => {
		vi.mocked(checkCustomLLM).mockResolvedValue(false);

		await expect(
			managerWith({ custom_llms_enabled: { default: false, override: true } }).assert('custom_llms_enabled'),
		).resolves.toBeUndefined();
	});

	test('an unentitled feature in use throws ResourceRestrictedError', async () => {
		vi.mocked(checkCustomLLM).mockResolvedValue(false);

		await expect(
			managerWith({ custom_llms_enabled: { default: false } }).assert('custom_llms_enabled'),
		).rejects.toBeInstanceOf(ResourceRestrictedError);
	});

	test('an unentitled feature not in use is allowed', async () => {
		vi.mocked(checkCustomLLM).mockResolvedValue(true);

		await expect(
			managerWith({ custom_llms_enabled: { default: false } }).assert('custom_llms_enabled'),
		).resolves.toBeUndefined();
	});
});
