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
	entitlements: LicenseEntitlements;
	usage: LicenseUsage;
} & LicenseLifecycle;

export interface LicensePreview {
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
		admin_seats: LicenseResolveSeatCandidate[];
		user_seats: LicenseResolveSeatCandidate[];
	};
}

export interface LicenseResolveSsoBlocker {
	code: 'MISSING_EMAIL' | 'AUTH_DISABLE_DEFAULT';
	user_id: string | null;
}

export interface LicenseResolveSsoSection {
	key: 'sso';
	readiness: {
		email_set: boolean;
		password_set: boolean;
	};
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
