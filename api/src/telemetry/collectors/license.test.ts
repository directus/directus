import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getEntitlementManager, getLicenseManager } from '../../license/index.js';
import { collectLicense } from './license.js';

vi.mock('../../license/index.js');

const mockDb = {} as Knex;

const licenseMeta = {
	name: 'Enterprise',
	version: '1',
	offline: false,
	issued_at: 1_700_000_000,
	expires_at: 1_800_000_000,
	renews_at: null,
	grace_period: 604_800,
	validation_interval: 86_400,
};

const entitlement = (limit: number, overage?: number, addon?: number) => ({ limit, overage, addon });

let licenseManager: any;
let entitlementManager: any;

const setup = (opts: {
	source?: 'env' | 'settings' | null;
	seats?: ReturnType<typeof entitlement>;
	usage?: Record<string, number>;
	hardLimits?: Record<string, number>;
	meta?: Partial<typeof licenseMeta> & { overage_billed?: Record<string, number> };
}) => {
	const seats = opts.seats ?? entitlement(10);
	const usage = opts.usage ?? { seats: 4, collections: 4, flows: 4 };

	licenseManager = {
		getSource: vi.fn().mockReturnValue(opts.source === undefined ? 'settings' : opts.source),
		getStatus: vi.fn().mockResolvedValue('active'),
		getInvalidReason: vi.fn().mockResolvedValue(null),
		getEditable: vi.fn().mockReturnValue(true),
		getLicense: vi.fn().mockResolvedValue({
			meta: { ...licenseMeta, ...opts.meta },
			entitlements: { seats, collections: entitlement(20), flows: entitlement(30) },
		}),
	};

	entitlementManager = {
		getEntitlementLimit: vi.fn(
			(key: string) => opts.hardLimits?.[key] ?? { seats: 10, collections: 20, flows: 30 }[key] ?? 5,
		),
		getUsage: vi.fn(async (key: string) => usage[key] ?? 0),
		isEntitled: vi.fn().mockReturnValue(true),
		getAppEntitlements: vi.fn().mockReturnValue({
			production_enabled: true,
			ai_translations_enabled: false,
			display_powered_by: 'HIDDEN',
		}),
	};

	vi.mocked(getLicenseManager).mockReturnValue(licenseManager);
	vi.mocked(getEntitlementManager).mockReturnValue(entitlementManager);
};

beforeEach(() => setup({}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectLicense', () => {
	test('reports licensed state and source', async () => {
		const result = await collectLicense(mockDb);

		expect(result.licensed).toBe(true);
		expect(result.source).toBe('settings');
		expect(result.status).toBe('active');
		expect(result.editable).toBe(true);
	});

	test('reports unlicensed when no license source is configured', async () => {
		setup({ source: null });

		const result = await collectLicense(mockDb);

		expect(result.licensed).toBe(false);
		expect(result.source).toBeNull();
	});

	test('reports license meta without the key or token', async () => {
		const result = await collectLicense(mockDb);

		expect(result.name).toBe('Enterprise');
		expect(result.expires_at).toBe(1_800_000_000);
		expect(result.renews_at).toBeNull();
		expect(JSON.stringify(result)).not.toMatch(/license_key|license_token/);
	});

	test('reports both the granted limit and the evaluated usage', async () => {
		const result = await collectLicense(mockDb);

		expect(result.entitlements.seats).toStrictEqual({
			limit: 10,
			overage: 0,
			addon: 0,
			hard_limit: 10,
			usage: 4,
			within_contract: true,
			within_hard_limit: true,
		});
	});

	test('distinguishes billable overage from a blocked instance', async () => {
		// contracted 10, +5 overage tolerance, 12 in use: over contract but still allowed
		setup({ seats: entitlement(10, 5), usage: { seats: 12 }, hardLimits: { seats: 15 } });

		const result = await collectLicense(mockDb);

		expect(result.entitlements.seats.within_contract).toBe(false);
		expect(result.entitlements.seats.within_hard_limit).toBe(true);
		expect(result.entitlements.seats.hard_limit).toBe(15);
	});

	test('flags an instance past its hard limit', async () => {
		setup({ seats: entitlement(10), usage: { seats: 99 }, hardLimits: { seats: 10 } });

		const result = await collectLicense(mockDb);

		expect(result.entitlements.seats.within_contract).toBe(false);
		expect(result.entitlements.seats.within_hard_limit).toBe(false);
	});

	test('reports unlimited entitlements as null but still measures usage', async () => {
		setup({ seats: entitlement(-1), usage: { seats: 250 }, hardLimits: { seats: -1 } });

		const result = await collectLicense(mockDb);

		expect(result.entitlements.seats.limit).toBeNull();
		expect(result.entitlements.seats.hard_limit).toBeNull();
		expect(result.entitlements.seats.usage).toBe(250);
		expect(result.entitlements.seats.within_hard_limit).toBe(true);
	});

	test('includes addon capacity in the hard limit', async () => {
		setup({ seats: entitlement(10, 0, 40), usage: { seats: 30 }, hardLimits: { seats: 50 } });

		const result = await collectLicense(mockDb);

		expect(result.entitlements.seats.addon).toBe(40);
		expect(result.entitlements.seats.hard_limit).toBe(50);
		expect(result.entitlements.seats.within_hard_limit).toBe(true);
	});

	test('reports feature flag and app entitlements', async () => {
		const result = await collectLicense(mockDb);

		expect(result.entitlements.telemetry_required).toBe(true);
		expect(result.entitlements.production_enabled).toBe(true);
		expect(result.entitlements.ai_translations_enabled).toBe(false);
		expect(result.entitlements.display_powered_by).toBe('HIDDEN');
	});

	test('defaults billed overage to zero when absent', async () => {
		const result = await collectLicense(mockDb);
		expect(result.overage_billed).toStrictEqual({ seats: 0, collections: 0, flows: 0 });
	});

	test('passes the database through to the usage counters', async () => {
		await collectLicense(mockDb);
		expect(entitlementManager.getUsage).toHaveBeenCalledWith('seats', { knex: mockDb });
	});
});
