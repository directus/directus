import {
	AddonNotAvailableError,
	AddonNotFoundError,
	AddonQuantityOutOfRangeError,
	LicenseInvalidError,
	LicenseManagedByEnvError,
	LicenseOfflineUnsupportedError,
	LicenseResolveIncompleteError,
	LicenseServiceUnavailableError,
} from '@directus/errors';
import { CORE_LICENSE } from '@directus/license';
import type { LicenseAddon, LicenseCheck, LicenseInfo, LicenseResolveAssessment } from './types.js';

// Temporary error handling
const LICENSE_ERROR_BY_CODE = {
	LICENSE_INVALID: LicenseInvalidError,
	LICENSE_MANAGED_BY_ENV: LicenseManagedByEnvError,
	LICENSE_OFFLINE_UNSUPPORTED: LicenseOfflineUnsupportedError,
	LICENSE_SERVICE_UNAVAILABLE: LicenseServiceUnavailableError,
	LICENSE_RESOLVE_INCOMPLETE: LicenseResolveIncompleteError,
	ADDON_NOT_FOUND: AddonNotFoundError,
	ADDON_NOT_AVAILABLE: AddonNotAvailableError,
	ADDON_QUANTITY_OUT_OF_RANGE: AddonQuantityOutOfRangeError,
} as const;

export type LicenseErrorCode = keyof typeof LICENSE_ERROR_BY_CODE;

export type LicenseScenario = 'active' | 'grace' | 'expired' | 'suspended' | 'canceled' | 'overage' | 'no-license';

const BASE_LICENSE: LicenseInfo = {
	status: 'active',
	source: 'settings',
	plan: 'team',
	license_id: '20d90f05-dfd8-4b39-a041-cd748a746028',
	resolution_required: false,
	type: 'TEAM',
	grace_period: 2592000,
	validation_interval: 86400,
	renews_at: 1776996042,
	entitlements: {
		seats: { limit: 10, addon: 2, overage: 1 },
		collections: { limit: 100 },
		activity_historical_timeframe: { limit: 2592000 },
		revision_historical_timeframe: { limit: 2592000 },
		sso_enabled: { default: true },
		offline_enabled: { default: false },
		telemetry_required: { default: false },
		custom_llms_enabled: { default: true },
		custom_policy_rules_enabled: { default: true },
		display_powered_by: 'NONE',
		production_enabled: { default: true },
	},
	usage: {
		seats: 1,
		collections: 15,
	},
};

const NO_LICENSE: LicenseInfo = {
	status: 'inactive',
	source: null,
	plan: 'core',
	license_id: null,
	resolution_required: false,
	...CORE_LICENSE.meta,
	entitlements: CORE_LICENSE.entitlements,
	usage: {
		seats: 1,
		collections: 5,
	},
};

export const MOCK_LICENSE_INFO_SCENARIOS: Record<LicenseScenario, LicenseInfo> = {
	active: BASE_LICENSE,

	grace: {
		...BASE_LICENSE,
		status: 'grace',
		expires_at: 1776996042,
		renews_at: undefined,
	},

	expired: {
		...BASE_LICENSE,
		status: 'expired',
		resolution_required: true,
		expires_at: 1776996042,
		renews_at: undefined,
	},

	suspended: {
		...BASE_LICENSE,
		status: 'suspended',
		resolution_required: true,
	},

	canceled: {
		...BASE_LICENSE,
		status: 'canceled',
		resolution_required: true,
		expires_at: 1776996042,
		renews_at: undefined,
	},

	overage: {
		...BASE_LICENSE,
		resolution_required: true,
		usage: {
			seats: 8,
			collections: 75,
		},
	},

	'no-license': NO_LICENSE,
};

export const MOCK_LICENSE_CHECK: LicenseCheck = {
	plan: {
		name: 'Team',
		code: 'team',
	},
	renews_at: 1776996042,
};

export const MOCK_LICENSE_RESOLVE: LicenseResolveAssessment = [
	{
		key: 'collections',
		limit: 50,
		candidates: [{ id: 'posts', label: 'Posts', icon: 'article' }],
	},
	{
		key: 'seats',
		limit: 3,
		candidates: {
			admin: [
				{
					id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
					email: 'admin@example.com',
					first_name: 'Alice',
					last_name: 'Doe',
					avatar: null,
					last_access: '2026-04-20T12:34:56Z',
				},
			],
			users: [],
		},
	},
	{
		key: 'sso',
		blockers: [{ code: 'MISSING_EMAIL', user_id: 'b2c3d4e5-6789-01ab-cdef-234567890abc' }],
	},
];

export const MOCK_LICENSE_ADDONS: LicenseAddon[] = [
	{
		id: 'addon_collections_pack',
		name: 'Data Model Collections',
		description: 'Additional +25 collections per pack',
		icon: 'deployed_code',
		availability: 'available',
		pricing_summary: '$100.00 per 25 collections / pack',
		min_quantity: 1,
		max_quantity: null,
		active_quantity: 0,
		scheduled_quantity: 0,
	},
	{
		id: 'addon_user_seats',
		name: 'User Seats',
		description: 'Additional user seats',
		icon: 'person_add',
		availability: 'available',
		pricing_summary: '$15.00 per seat',
		min_quantity: 1,
		max_quantity: null,
		active_quantity: 5,
		scheduled_quantity: 3,
	},
];

export function pickLicenseScenario(scenario: unknown): LicenseInfo {
	return MOCK_LICENSE_INFO_SCENARIOS[scenario as LicenseScenario] ?? MOCK_LICENSE_INFO_SCENARIOS.active;
}

export function maybeThrowMockError(errorCode: unknown, allowed: readonly LicenseErrorCode[]): void {
	if (typeof errorCode !== 'string') return;
	if (!allowed.includes(errorCode as LicenseErrorCode)) return;

	const ErrorClass = LICENSE_ERROR_BY_CODE[errorCode as LicenseErrorCode];
	throw new ErrorClass();
}
