import type { License as Token } from '@directus/license';

type Addon = {
	name: string;
};

export type License = {
	name: string;
	key: string;
	entitlements: Token['entitlements'];
	meta: Token['meta'];
	max_projects: number;
	projects: { id: string; url: string }[];
	/** Available Addons */
	addons: Addon[];
};

export const licenses: Record<string, License> = {
	// Base license for testing
	'D0000-00000-00000-00000-00000': {
		max_projects: 10_000,
		key: 'D0000-00000-00000-00000-00000',
		addons: [],
		name: 'test-license',
		projects: [],
		meta: {
			name: 'UNLIMITED',
			version: '1',
			public_url: 'http://localhost',
			grace_period: 60 * 60 * 24,
			validation_interval: 60 * 60,
			expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
			offline: false,
		},
		entitlements: {
			collections: { limit: -1 },
			seats: { limit: -1 },
			activity_historical_timeframe: {
				limit: -1,
			},
			revision_historical_timeframe: { limit: -1 },
			sso_enabled: { default: true },
			offline_enabled: { default: false },
			telemetry_required: { default: false },
			display_powered_by: 'NONE',
			custom_llms_enabled: { default: true },
			custom_permission_rules_enabled: { default: true },
			ai_translations_enabled: { default: true },
			production_enabled: { default: true },
			flows: { limit: -1 },
		},
	},
};
