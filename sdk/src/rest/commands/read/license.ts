import type { RestCommand } from '../../types.js';

export type LicenseSource = 'env' | 'settings' | null;

export type LicenseStatus = 'active' | 'grace' | 'expired' | 'suspended' | 'canceled' | 'inactive';

export type LicensePlan = string;

export interface LicenseEntitlements {
	seats: number;
	collections: number;
	activity_historical_timeframe: number;
	revisions_historical_timeframe: number;
	sso_enabled: boolean;
	offline_enabled: boolean;
	telemetry_required: boolean;
	custom_llms_enabled: boolean;
	custom_policy_rules_enabled: boolean;
	display_powered_by: boolean;
	production_enabled: boolean;
}

export type LicenseUsage = Partial<Record<keyof LicenseEntitlements, number>>;

interface LicenseLifecycleRenewal {
	renews_at: number;
	expires_at?: never;
}

interface LicenseLifecycleExpiration {
	expires_at: number;
	renews_at?: never;
}

export type LicenseLifecycle = LicenseLifecycleRenewal | LicenseLifecycleExpiration;

export type LicenseInfo = {
	status: LicenseStatus;
	source: LicenseSource;
	plan: LicensePlan;
	license_id: string | null;
	grace_period: number;
	resolution_required: boolean;
	entitlements: LicenseEntitlements;
	usage: LicenseUsage;
} & LicenseLifecycle;

export interface LicenseCheck {
	plan: {
		name: string;
		code: LicensePlan;
	};
	expires_at?: number;
	renews_at?: number;
}

export interface LicenseResolveCollectionCandidate {
	id: string;
	label: string;
	icon: string | null;
}

export interface LicenseResolveSeatCandidate {
	id: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	avatar: string | null;
	last_access: string | null;
}

export interface LicenseResolveCollectionsSection {
	key: 'collections';
	limit: number;
	candidates: LicenseResolveCollectionCandidate[];
}

export interface LicenseResolveSeatsSection {
	key: 'seats';
	limit: number;
	candidates: {
		admin: LicenseResolveSeatCandidate[];
		users: LicenseResolveSeatCandidate[];
	};
}

export interface LicenseResolveSsoBlocker {
	code: 'MISSING_EMAIL' | 'MISSING_PASSWORD' | 'AUTH_DISABLE_DEFAULT';
	user_id: string | null;
}

export interface LicenseResolveSsoSection {
	key: 'sso';
	blockers: LicenseResolveSsoBlocker[];
}

export type LicenseResolveSection =
	| LicenseResolveCollectionsSection
	| LicenseResolveSeatsSection
	| LicenseResolveSsoSection;

export type LicenseResolveAssessment = LicenseResolveSection[];

export type AddonAvailability = 'available' | 'upgrade_required';

export interface LicenseAddon {
	id: string;
	name: string;
	description: string;
	icon: string;
	availability: AddonAvailability;
	pricing_summary: string;
	min_quantity: number;
	max_quantity: number | null;
	active_quantity: number;
	scheduled_quantity: number;
}

/**
 * Mock-only query params (temporary). The `scenario` and `error` parameters are
 * recognized by the mocked `/license` controller during development to switch
 * the response payload or trigger a specific error. They will be removed once
 * the real licensing service is wired.
 */
export type LicenseScenario = 'active' | 'grace' | 'expired' | 'suspended' | 'canceled' | 'overage' | 'no-license';

export type LicenseMockQuery = {
	scenario?: LicenseScenario;
	error?: string;
};

/**
 * Get the current license state, including entitlements and usage.
 * @param query Optional mock-only query (`scenario`) — see {@link LicenseMockQuery}.
 * @returns The license info payload.
 */
export const readLicense =
	<Schema>(query?: LicenseMockQuery): RestCommand<LicenseInfo, Schema> =>
	() => ({
		method: 'GET',
		path: '/license',
		params: query ?? {},
	});

/**
 * Validate a license key without applying it.
 * @param query Optional mock-only query (`error`) — see {@link LicenseMockQuery}.
 * @returns A check of the license that would be applied.
 */
export const readLicenseCheck =
	<Schema>(query?: LicenseMockQuery): RestCommand<LicenseCheck, Schema> =>
	() => ({
		method: 'GET',
		path: '/license/check',
		params: query ?? {},
	});

/**
 * Get the resource resolution assessment when usage exceeds entitlements.
 * @returns Sections describing what needs to be reduced.
 */
export const readLicenseResolve =
	<Schema>(): RestCommand<LicenseResolveAssessment, Schema> =>
	() => ({
		method: 'GET',
		path: '/license/resolve',
	});

/**
 * Get the catalog of addons available for the current subscription.
 * @returns An array of addon objects.
 */
export const readLicenseAddons =
	<Schema>(): RestCommand<LicenseAddon[], Schema> =>
	() => ({
		method: 'GET',
		path: '/license/addons',
	});
