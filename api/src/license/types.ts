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
