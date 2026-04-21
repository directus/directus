import { defaultEntitlements } from './defaults.js';
import type { LicenseEntitlements } from './types.js';

export function normalizeLicenseEntitlements(source: Record<string, unknown> | undefined): LicenseEntitlements {
	return {
		collections: normalizeEntitlementValue(defaultEntitlements.collections, source?.['collections']),
		seats: normalizeEntitlementValue(defaultEntitlements.seats, source?.['seats']),
		activity_history_days: normalizeEntitlementValue(
			defaultEntitlements.activity_history_days,
			source?.['activity_history_days'],
		),
		revisions_history_days: normalizeEntitlementValue(
			defaultEntitlements.revisions_history_days,
			source?.['revisions_history_days'],
		),
		sso_enabled: normalizeEntitlementValue(defaultEntitlements.sso_enabled, source?.['sso_enabled']),
		offline_enabled: normalizeEntitlementValue(defaultEntitlements.offline_enabled, source?.['offline_enabled']),
		custom_policy_rules_enabled: normalizeEntitlementValue(
			defaultEntitlements.custom_policy_rules_enabled,
			source?.['custom_policy_rules_enabled'],
		),
		scheduled_publishing_enabled: normalizeEntitlementValue(
			defaultEntitlements.scheduled_publishing_enabled,
			source?.['scheduled_publishing_enabled'],
		),
		custom_llm_enabled: normalizeEntitlementValue(
			defaultEntitlements.custom_llm_enabled,
			source?.['custom_llm_enabled'],
		),
		analytics_opt_out_enabled: normalizeEntitlementValue(
			defaultEntitlements.analytics_opt_out_enabled,
			source?.['analytics_opt_out_enabled'],
		),
		hide_directus_branding_enabled: normalizeEntitlementValue(
			defaultEntitlements.hide_directus_branding_enabled,
			source?.['hide_directus_branding_enabled'],
		),
	};
}

function normalizeEntitlementValue<T>(defaultValue: T, sourceValue: unknown): T {
	if (Array.isArray(sourceValue)) {
		return [...sourceValue] as T;
	}

	if (sourceValue !== undefined && sourceValue !== null) {
		if (typeof sourceValue === 'boolean' || typeof sourceValue === 'string') {
			return sourceValue as T;
		}

		if (typeof sourceValue === 'object') {
			return structuredClone(sourceValue) as T;
		}
	}

	if (Array.isArray(defaultValue)) {
		return [...defaultValue] as T;
	}

	if (typeof defaultValue === 'object' && defaultValue !== null) {
		return structuredClone(defaultValue);
	}

	return defaultValue;
}
