import type { LicenseEntitlements } from './types.js';

export const defaultEntitlements: LicenseEntitlements = {
	collections: {
		limit: 50,
		is_overage_allowed: false,
		hard_limit: 50,
	},
	seats: {
		limit: 3,
		is_overage_allowed: false,
		hard_limit: 3,
	},
	activity_history_days: {
		limit: 30,
	},
	revisions_history_days: {
		limit: 30,
	},
	sso_enabled: false,
	offline_enabled: false,
	custom_policy_rules_enabled: false,
	scheduled_publishing_enabled: false,
	custom_llm_enabled: false,
	analytics_opt_out_enabled: false,
	hide_directus_branding_enabled: false,
};

export const graceEntitlements: LicenseEntitlements = createGraceEntitlements(defaultEntitlements);

function createGraceEntitlements(source: LicenseEntitlements): LicenseEntitlements {
	return Object.fromEntries(
		Object.entries(source).map(([key, value]) => {
			if (typeof value === 'boolean') {
				return [key, true];
			}

			if (typeof value === 'object' && value !== null && 'limit' in value) {
				return [
					key,
					{
						...value,
						limit: null,
						is_overage_allowed: true,
						hard_limit: null,
					},
				];
			}

			return [key, value];
		}),
	) as LicenseEntitlements;
}
