import type { Entitlements, Meta } from '@directus/license';
import type { RestCommand } from '../../types.js';

export type LicenseSource = 'env' | 'settings' | null;

export type LicenseStatus = 'active' | 'grace' | 'expired' | 'suspended' | 'canceled';

export type LicenseEntitlements = Entitlements;

export type LicenseUsage = {
	seats: number;
	collections: number;
};

export type LicenseInfo = {
	status: LicenseStatus;
	source: LicenseSource;
	entitlements: LicenseEntitlements;
	usage: LicenseUsage;
} & Pick<Meta, 'type' | 'expires_at' | 'renews_at' | 'offline' | 'grace_period'>;

export interface LicenseCheck {
	type: string;
	expires_at: number;
	production_enabled: boolean;
}

export type PendingResolutionLimitKey = 'collections' | 'seats';

export type PendingResolutionFeatureGateKey = 'sso' | 'custom_llms_enabled' | 'custom_policy_rules_enabled';

export type PendingResolutionKey = PendingResolutionLimitKey | PendingResolutionFeatureGateKey;

export interface PendingResolutionBase {
	key: PendingResolutionKey;
	kind: 'limit' | 'feature_gate';
}

export interface PendingResolutionLimit<TKey extends PendingResolutionLimitKey, TCandidate>
	extends PendingResolutionBase {
	kind: 'limit';
	key: TKey;
	limit: number;
	usage: number;
	candidates: TCandidate[];
}

export interface PendingResolutionFeatureGate<TKey extends PendingResolutionFeatureGateKey, TBlocker = never>
	extends PendingResolutionBase {
	kind: 'feature_gate';
	key: TKey;
	blockers?: TBlocker;
}

export type PendingResolutionLimitCollections = PendingResolutionLimit<'collections', string>;

export type PendingResolutionSeatCandidate = {
	id: string;
	first_name: string | null;
	last_name: string | null;
	avatar: string | null;
};

export type PendingResolutionLimitSeats = PendingResolutionLimit<'seats', PendingResolutionSeatCandidate>;

export type PendingResolutionFeatureGateSSO = PendingResolutionFeatureGate<
	'sso',
	('ADMIN_MISSING_EMAIL' | 'ADMIN_MISSING_PASSWORD')[]
>;

export type PendingResolutionFeatureGateCustomLLMs = PendingResolutionFeatureGate<'custom_llms_enabled'>;

export type PendingResolutionFeatureGateCustomPolicyRules = PendingResolutionFeatureGate<'custom_policy_rules_enabled'>;

export type PendingResolution =
	| PendingResolutionLimitCollections
	| PendingResolutionLimitSeats
	| PendingResolutionFeatureGateSSO
	| PendingResolutionFeatureGateCustomLLMs
	| PendingResolutionFeatureGateCustomPolicyRules;

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
 * Get the current license state, including entitlements and usage.
 * @returns The license info payload.
 */
export const readLicense =
	<Schema>(): RestCommand<LicenseInfo, Schema> =>
	() => ({
		method: 'GET',
		path: '/license',
	});

/**
 * Validate a license key without applying it.
 * @returns A check of the license that would be applied.
 */
export const readLicenseCheck =
	<Schema>(): RestCommand<LicenseCheck, Schema> =>
	() => ({
		method: 'GET',
		path: '/license/check',
	});

/**
 * Get the pending resolution assessment when usage exceeds entitlements
 * or feature gates need to be addressed.
 * @returns Sections describing what needs to be resolved.
 */
export const readLicensePendingResolution =
	<Schema>(): RestCommand<PendingResolution[], Schema> =>
	() => ({
		method: 'GET',
		path: '/license/pending-resolution',
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
