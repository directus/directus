export type LicenseStatus = 'inactive' | 'active' | 'deactivated';
export type LicenseTerminalStatus = 'canceled' | 'expired' | null;
export type LicenseSource = 'env' | 'settings' | null;
export type EnvLicenseMode = 'env_key' | 'env_offline' | null;
export type LicenseGraceType = 'onboarding' | 'expiration' | null;
export type DerivedLicenseStatus = 'inactive' | 'active' | 'grace' | 'locked' | 'invalid' | 'canceled';
export type LicensePayloadStatus = 'active' | 'past_due' | 'canceled' | 'expired';

export type EnvLicense = {
	source: LicenseSource;
	mode: EnvLicenseMode;
	value?: string;
};

export type LicenseTokenMetadata = {
	id: string;
	status: LicensePayloadStatus;
	plan: string;
	project_id: string;
	public_url: string | null;
	is_oig: boolean;
	applicant_id: string | null;
	refresh_interval: number;
	grace_period: number;
	expires_at: number | null;
	renews_at: number | null;
	addons: string[];
	entitlements: Record<string, unknown>;
};

export type LicenseTokenPayload = {
	iss?: string;
	aud?: string;
	jti?: string;
	iat?: number;
	exp?: number;
	metadata: LicenseTokenMetadata;
};

export type LicenseDisplayMetadata = {
	status: LicensePayloadStatus | null;
	plan: string | null;
	project_id: string | null;
	public_url: string | null;
	is_oig: boolean | null;
	refresh_interval: number | null;
	grace_period: number | null;
	expires_at: number | null;
	renews_at: number | null;
	addons: string[];
};

export type LicenseGatePayloadState = 'valid' | 'retained' | 'missing' | 'invalid';

export type LicenseGateSnapshot = {
	hasStoredLicenseKey: boolean;
	durableStatus: LicenseStatus | null;
	terminal: LicenseTerminalStatus;
	graceOn: string | Date | null;
	payloadState: LicenseGatePayloadState;
	payload: LicenseTokenPayload | null;
	displayMetadata: LicenseDisplayMetadata | null;
	payloadStatus?: LicensePayloadStatus;
	tokenExpiresAt?: number | null;
	gracePeriod?: number | null;
};

export type NumericGate = {
	limit: number | null;
	base?: number | null;
	overage_billed?: number | null;
	is_overage_allowed?: boolean;
	hard_limit?: number | null;
};

export type LicenseEntitlements = {
	collections: NumericGate;
	seats: NumericGate;
	activity_history_days: NumericGate;
	revisions_history_days: NumericGate;
	sso_enabled: boolean;
	offline_enabled: boolean;
	custom_policy_rules_enabled: boolean;
	scheduled_publishing_enabled: boolean;
	custom_llm_enabled: boolean;
	analytics_opt_out_enabled: boolean;
	hide_directus_branding_enabled: boolean;
};

export type LicenseDeactivationBlocker = {
	code: string;
	resource_id: string | null;
	next_action: string | null;
};

export type LicenseDeactivationCollectionCandidate = {
	id: string;
	label: string;
	icon: string | null;
};

export type LicenseDeactivationSeatCandidate = {
	id: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	avatar: string | null;
	last_access: string | null;
};

export type LicenseDeactivationTargetMode = 'fallback' | 'license_change';

export type LicenseDeactivationTargetEntitlements = {
	collections: {
		limit: number | null;
	};
	seats: {
		limit: number | null;
	};
	sso_enabled: boolean;
};

export type LicenseDeactivationSectionBase<TCurrent = number | boolean> = {
	key: 'collections' | 'seats' | 'sso';
	required: boolean;
	target: number | boolean;
	current: TCurrent;
	needed_reduction: number;
	blockers: LicenseDeactivationBlocker[];
};

export type LicenseDeactivationCollectionsSection = LicenseDeactivationSectionBase<number> & {
	key: 'collections';
	candidates: LicenseDeactivationCollectionCandidate[];
};

export type LicenseDeactivationSeatsSection = LicenseDeactivationSectionBase<number> & {
	key: 'seats';
	candidates: {
		admin_seats: LicenseDeactivationSeatCandidate[];
		user_seats: LicenseDeactivationSeatCandidate[];
	};
};

export type LicenseDeactivationSSOReadiness = {
	email_set: boolean;
	password_set: boolean;
};

export type LicenseDeactivationSSOSection = LicenseDeactivationSectionBase<boolean> & {
	key: 'sso';
	readiness: LicenseDeactivationSSOReadiness;
};

export type LicenseDeactivationSection =
	| LicenseDeactivationCollectionsSection
	| LicenseDeactivationSeatsSection
	| LicenseDeactivationSSOSection;

export type LicenseDeactivationAssessment = {
	compliant: boolean;
	target_mode: LicenseDeactivationTargetMode;
	target_entitlements: LicenseDeactivationTargetEntitlements;
	sections: LicenseDeactivationSection[];
};

export type LicenseDeactivationApplyPayload = {
	collections?: string[];
	seats?: {
		admin_seats?: string[];
		user_seats?: string[];
	};
	sso?: {
		enabled: boolean;
		email?: string | null;
		password?: string | null;
	};
};

export type LicenseDeactivationApplyResult = LicenseDeactivationAssessment & {
	applied: boolean;
};
