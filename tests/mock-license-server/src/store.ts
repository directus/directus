import { randomUUID } from 'crypto';
import { DAY_IN_S } from './constants.js';
import type { MockLicense } from './types.js';
import { createLicense } from './utils.js';

const now = () => Math.floor(Date.now() / 1000);

/**
 * Pre-registered licenses shared across tests.
 *
 * Only configurations used by more than one test file should live here.
 * One-off licenses can be built inline via `createLicense({ ... })`.
 *
 */
export const licenseStore: Record<string, MockLicense> = {
	// Unlimited, no enforcement.
	'D0000-00000-00000-00000-0000K': createLicense({
		key: 'D0000-00000-00000-00000-0000K',
		name: 'UNLIMITED',
		meta: { name: 'UNLIMITED' },
	}),

	// Realistic limited plan with all features enabled and addons available
	'D0001-00000-00000-00000-0000J': createLicense({
		key: 'D0001-00000-00000-00000-0000J',
		name: 'LIMITED',
		meta: { name: 'LIMITED' },
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 10 },
			flows: { limit: 25 },
			activity_historical_timeframe: { limit: 90 * DAY_IN_S },
			revision_historical_timeframe: { limit: 90 * DAY_IN_S },
			sso_enabled: { default: true },
			offline_enabled: { default: false },
			telemetry_required: { default: false },
			display_powered_by: 'HIDDEN',
			custom_llms_enabled: { default: true },
			custom_permission_rules_enabled: { default: true },
			ai_translations_enabled: { default: true },
			production_enabled: { default: true },
		},
		addons: [
			{
				id: randomUUID(),
				active_quantity: 0,
				billing_interval: 'monthly',
				description: 'Seats Addon',
				icon: 'group',
				min_quantity: 0,
				max_quantity: 10,
				name: 'Lorem Ipsum',
				pricing_summary: 'The seat addon pricing summary',
				unit: 'seats',
				upgrade_required: false,
			},
			{
				id: randomUUID(),
				active_quantity: 1,
				billing_interval: 'monthly',
				description: 'Collections Addon',
				icon: 'deployed_code',
				min_quantity: 0,
				max_quantity: 10,
				name: 'Dolor Sat',
				pricing_summary: 'The collection addon pricing summary',
				unit: 'collections',
				upgrade_required: false,
			},
			{
				id: randomUUID(),
				active_quantity: 2,
				billing_interval: 'monthly',
				description: 'Upgrade Addon',
				icon: 'deployed_code',
				min_quantity: 0,
				max_quantity: 10,
				name: 'Amet',
				pricing_summary: 'The upgrade addon pricing summary',
				unit: 'flows',
				upgrade_required: true,
			},
		],
	}),

	// LIMITED license expired 2 days ago, still within grace period
	'D0002-00000-00000-00000-0000H': createLicense({
		key: 'D0002-00000-00000-00000-0000H',
		name: 'LIMITED_GRACE',
		meta: {
			name: 'LIMITED_GRACE',
			version: '2026-05-08',
			grace_period: 7 * DAY_IN_S,
			validation_interval: 60 * 60,
			expires_at: now() - 2 * DAY_IN_S,
			offline: false,
		},
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 10 },
			flows: { limit: 25 },
			activity_historical_timeframe: { limit: 90 * DAY_IN_S },
			revision_historical_timeframe: { limit: 90 * DAY_IN_S },
			sso_enabled: { default: true },
			offline_enabled: { default: false },
			telemetry_required: { default: false },
			display_powered_by: 'HIDDEN',
			custom_llms_enabled: { default: true },
			custom_permission_rules_enabled: { default: true },
			ai_translations_enabled: { default: true },
			production_enabled: { default: true },
		},
	}),

	// LIMITED license past grace period — should force downgrade
	'D0003-00000-00000-00000-0000G': createLicense({
		key: 'D0003-00000-00000-00000-0000G',
		name: 'LIMITED_EXPIRED',
		meta: {
			name: 'LIMITED_EXPIRED',
			version: '2026-05-08',
			grace_period: DAY_IN_S,
			validation_interval: 60 * 60,
			expires_at: now() - 10 * DAY_IN_S,
			offline: false,
		},
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 10 },
			flows: { limit: 25 },
			activity_historical_timeframe: { limit: 90 * DAY_IN_S },
			revision_historical_timeframe: { limit: 90 * DAY_IN_S },
			sso_enabled: { default: true },
			offline_enabled: { default: false },
			telemetry_required: { default: false },
			display_powered_by: 'HIDDEN',
			custom_llms_enabled: { default: true },
			custom_permission_rules_enabled: { default: true },
			ai_translations_enabled: { default: true },
			production_enabled: { default: true },
		},
	}),

	// Tight 1/1/1 limits and no features enabled
	'D0005-00000-00000-00000-0000E': createLicense({
		key: 'D0005-00000-00000-00000-0000E',
		name: 'TINY',
		meta: { name: 'TINY' },
		entitlements: {
			collections: { limit: 1 },
			seats: { limit: 1 },
			flows: { limit: 1 },
			activity_historical_timeframe: { limit: 7 * DAY_IN_S },
			revision_historical_timeframe: { limit: 7 * DAY_IN_S },
			sso_enabled: { default: false },
			offline_enabled: { default: false },
			telemetry_required: { default: false },
			display_powered_by: 'DIRECTUS',
			custom_llms_enabled: { default: false },
			custom_permission_rules_enabled: { default: false },
			ai_translations_enabled: { default: false },
			production_enabled: { default: false },
		},
	}),
};
