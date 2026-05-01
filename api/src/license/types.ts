import type { Entitlements, License, Meta } from '@directus/license';

export type LicenseSource = 'env' | 'settings' | null;

export type LicenseStatus = 'active' | 'grace' | 'expired' | 'suspended' | 'canceled';

export type LicenseInfo = {
	status: LicenseStatus;
	source: LicenseSource;
	entitlements: Entitlements;
	usage: {
		seats: number;
		collections: number;
	};
} & Pick<Meta, 'type' | 'expires_at' | 'renews_at' | 'offline' | 'grace_period'>;

export interface LicenseCheck {
	type: string;
	expires_at: number;
	production_enabled: boolean;
}

export type PendingResolutionLimitKey = 'collections' | 'seats';

export type PendingResolutionFeatureGateKey = 'sso';

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

export interface PendingResolutionFeatureGate<TKey extends PendingResolutionFeatureGateKey, TBlocker extends string>
	extends PendingResolutionBase {
	kind: 'feature_gate';
	key: TKey;
	blockers: TBlocker[];
}

export type PendingResolutionLimitCollections = PendingResolutionLimit<'collections', { id: string }>;

export type PendingResolutionLimitSeats = PendingResolutionLimit<
	'seats',
	{
		id: string;
		first_name: string | null;
		last_name: string | null;
		avatar: string | null;
	}
>;

export type PendingResolutionFeatureGateSso = PendingResolutionFeatureGate<
	'sso',
	'ADMIN_MISSING_EMAIL' | 'ADMIN_MISSING_PASSWORD'
>;

export type PendingResolution =
	| PendingResolutionLimitCollections
	| PendingResolutionLimitSeats
	| PendingResolutionFeatureGateSso;

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
