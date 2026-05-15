import { randomUUID } from 'crypto';
import type { MockLicense } from './types.js';
import { createLicense } from './utils.js';

const DAY = 60 * 60 * 24;
const now = () => Math.floor(Date.now() / 1000);

export const licenseStore: Record<string, MockLicense> = {
	// Baseline — unlimited, no enforcement
	'D0000-00000-00000-00000-00000': createLicense({
		key: 'D0000-00000-00000-00000-00000',
		name: 'UNLIMITED',
	}),

	// Standard team plan — 10 seats / 50 collections
	'D0001-00000-00000-00000-0000Z': createLicense({
		key: 'D0001-00000-00000-00000-0000Z',
		name: 'TEAM',
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 10 },
			flows: { limit: 25 },
			activity_historical_timeframe: { limit: 90 * DAY },
			revision_historical_timeframe: { limit: 90 * DAY },
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
				description: 'Alodda Seats addon',
				icon: 'group',
				min_quantity: 0,
				max_quantity: 10,
				name: 'Gimme more seats',
				pricing_summary: 'pay os som 💰',
				unit: 'seats',
				upgrade_required: false,
			},
			{
				id: randomUUID(),
				active_quantity: 0,
				billing_interval: 'monthly',
				description: 'Get mooore collections',
				icon: 'deployed_code',
				min_quantity: 0,
				max_quantity: 10,
				name: 'Coollections 😎',
				pricing_summary: 'pay os som 💰',
				unit: 'collections',
				upgrade_required: false,
			},
		],
	}),

	// Team expired 2 days ago, still in grace
	'D0002-00000-00000-00000-0000Y': createLicense({
		key: 'D0002-00000-00000-00000-0000Y',
		name: 'TEAM_GRACE',
		meta: {
			name: 'TEAM_GRACE',
			version: '2026-05-08',
			grace_period: 7 * DAY,
			validation_interval: 60 * 60,
			expires_at: now() - 2 * DAY,
			offline: false,
		},
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 10 },
			flows: { limit: 25 },
			activity_historical_timeframe: { limit: 90 * DAY },
			revision_historical_timeframe: { limit: 90 * DAY },
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

	// Team past grace period
	'D0003-00000-00000-00000-0000X': createLicense({
		key: 'D0003-00000-00000-00000-0000X',
		name: 'TEAM_EXPIRED',
		meta: {
			name: 'TEAM_EXPIRED',
			version: '2026-05-08',
			grace_period: DAY,
			validation_interval: 60 * 60,
			expires_at: now() - 10 * DAY,
			offline: false,
		},
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 10 },
			flows: { limit: 25 },
			activity_historical_timeframe: { limit: 90 * DAY },
			revision_historical_timeframe: { limit: 90 * DAY },
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

	// Open Innovation Grant — restricted features
	'D0004-00000-00000-00000-0000W': createLicense({
		key: 'D0004-00000-00000-00000-0000W',
		name: 'OIG',
		entitlements: {
			collections: { limit: 25 },
			seats: { limit: 5 },
			flows: { limit: 10 },
			activity_historical_timeframe: { limit: 30 * DAY },
			revision_historical_timeframe: { limit: 30 * DAY },
			sso_enabled: { default: false },
			offline_enabled: { default: false },
			telemetry_required: { default: true },
			display_powered_by: 'OIG',
			custom_llms_enabled: { default: false },
			custom_permission_rules_enabled: { default: false },
			ai_translations_enabled: { default: false },
			production_enabled: { default: true },
		},
	}),

	// Tight 1/1/1 limits — enforcement testing
	'D0005-00000-00000-00000-0000V': createLicense({
		key: 'D0005-00000-00000-00000-0000V',
		name: 'TINY',
		entitlements: {
			collections: { limit: 1 },
			seats: { limit: 1 },
			flows: { limit: 1 },
			activity_historical_timeframe: { limit: 7 * DAY },
			revision_historical_timeframe: { limit: 7 * DAY },
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

	// Free tier — Directus branding
	'D0006-00000-00000-00000-0000T': createLicense({
		key: 'D0006-00000-00000-00000-0000T',
		name: 'CORE',
		entitlements: {
			collections: { limit: 10 },
			seats: { limit: 3 },
			flows: { limit: 5 },
			activity_historical_timeframe: { limit: 14 * DAY },
			revision_historical_timeframe: { limit: 14 * DAY },
			sso_enabled: { default: false },
			offline_enabled: { default: false },
			telemetry_required: { default: false },
			display_powered_by: 'DIRECTUS',
			custom_llms_enabled: { default: false },
			custom_permission_rules_enabled: { default: false },
			ai_translations_enabled: { default: false },
			production_enabled: { default: true },
		},
	}),
};
