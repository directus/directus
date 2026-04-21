export type LicenseSource = 'env' | 'settings' | null;

export type LicenseStatus = 'inactive' | 'active' | 'grace' | 'locked' | 'invalid' | 'canceled';
export type LicensePayloadStatus = 'active' | 'past_due' | 'canceled' | 'expired';

export type LicenseGraceType = 'onboarding' | 'expiration' | null;

export type LicenseNumericEntitlement = {
	limit: number | null;
	base?: number | null;
	overage_billed?: number | null;
	is_overage_allowed?: boolean;
	hard_limit?: number | null;
};

export type LicenseEntitlements = {
	collections: LicenseNumericEntitlement;
	seats: LicenseNumericEntitlement;
	activity_history_days: LicenseNumericEntitlement;
	revisions_history_days: LicenseNumericEntitlement;
	sso_enabled: boolean;
	offline_enabled: boolean;
	custom_policy_rules_enabled: boolean;
	scheduled_publishing_enabled: boolean;
	custom_llm_enabled: boolean;
	analytics_opt_out_enabled: boolean;
	hide_directus_branding_enabled: boolean;
};

export type LicenseUsageSummary = {
	collections: {
		current: number;
	};
	seats: {
		current: number;
		remaining: number | null;
	};
};

export type ServerInfoLicense = LicenseEntitlements;

export type BrandingLabelKey = 'brand_directus_label' | 'brand_oig_label';

export type ServerLicenseInfo = {
	source: LicenseSource;
	show_license_key_field: boolean;
	license_status: LicenseStatus;
	license_locked: boolean;
	license_grace_type: LicenseGraceType;
	status: LicensePayloadStatus | null;
	plan: string | null;
	refresh_interval: number | null;
	grace_period: number | null;
	expires_at: number | null;
	renews_at: number | null;
	entitlements: LicenseEntitlements;
	usage: LicenseUsageSummary;
};
