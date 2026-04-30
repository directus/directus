import type { Entitlements, Meta } from '@directus/license';

export type LicenseSource = 'env' | 'settings' | null;

export type LicenseStatus = 'active' | 'grace' | 'expired' | 'suspended' | 'canceled';

export type LicensePlan = string;

export type LicenseInfo = {
	status: LicenseStatus;
	source: LicenseSource;
	entitlements: Entitlements;
	usage: {
		seats: number;
		collections: number;
	};
} & Pick<Meta, 'type' | 'expires_at' | 'renews_at' | 'offline'>;

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
