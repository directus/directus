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
import type { LicenseAddon, LicenseInfo, LicensePreview, LicenseResolveAssessment } from './types.js';

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
	renews_at: 1776996042,
	grace_period: 2592000,
	entitlements: {
		seats: 10,
		collections: 100,
		activity_historical_timeframe: 2592000,
		revisions_historical_timeframe: 2592000,
		sso_enabled: true,
		offline_enabled: false,
		telemetry_required: false,
		custom_llms_enabled: true,
		custom_policy_rules_enabled: true,
		display_powered_by: true,
		production_enabled: true,
	},
	usage: {
		seats: 1,
		collections: 15,
	},
};

const CORE_ENTITLEMENTS: LicenseInfo['entitlements'] = {
	seats: 3,
	collections: 50,
	activity_historical_timeframe: 604800,
	revisions_historical_timeframe: 604800,
	sso_enabled: false,
	offline_enabled: false,
	telemetry_required: true,
	custom_llms_enabled: false,
	custom_policy_rules_enabled: false,
	display_powered_by: true,
	production_enabled: true,
};

const NO_LICENSE: LicenseInfo = {
	status: 'inactive',
	source: null,
	plan: 'core',
	license_id: null,
	expires_at: 0,
	grace_period: 0,
	entitlements: CORE_ENTITLEMENTS,
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
	} as LicenseInfo,

	expired: {
		...BASE_LICENSE,
		status: 'expired',
		expires_at: 1776996042,
		renews_at: undefined,
	} as LicenseInfo,

	suspended: {
		...BASE_LICENSE,
		status: 'suspended',
	},

	canceled: {
		...BASE_LICENSE,
		status: 'canceled',
		expires_at: 1776996042,
		renews_at: undefined,
	} as LicenseInfo,

	overage: {
		...BASE_LICENSE,
		usage: {
			seats: 8,
			collections: 75,
		},
	},

	'no-license': NO_LICENSE,
};

export const MOCK_LICENSE_PREVIEW: LicensePreview = {
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
			admin_seats: [
				{
					id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
					email: 'admin@example.com',
					first_name: 'Alice',
					last_name: 'Doe',
					avatar: null,
					last_access: '2026-04-20T12:34:56Z',
				},
			],
			user_seats: [],
		},
	},
	{
		key: 'sso',
		readiness: { email_set: false, password_set: true },
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
