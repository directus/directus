import type { SchemaOverview } from '@directus/types';
import { type Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getSystemCache, setSystemCache } from '../../cache.js';
import { getDatabase } from '../../database/index.js';
import { useLogger } from '../../logger/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { collectConfig } from '../collectors/config.js';
import { collectFeatures } from '../collectors/features.js';
import { collectLicense } from '../collectors/license.js';
import { collectApiRequestMetrics } from '../collectors/metrics/api-requests.js';
import { collectMetrics } from '../collectors/metrics/index.js';
import { collectProject } from '../collectors/project.js';
import type {
	ApiRequestMetrics,
	ExtensionBreakdown,
	TelemetryConfig,
	TelemetryFeatures,
	TelemetryLicense,
	TelemetryMetrics,
	TelemetryProject,
} from '../types/report.js';
import { getReport } from './get-report.js';

vi.mock('../../cache.js', () => ({
	getSystemCache: vi.fn().mockResolvedValue(undefined),
	setSystemCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../database/index.js');
vi.mock('../../logger/index.js');
vi.mock('../../utils/get-schema.js');
vi.mock('../collectors/project.js');
vi.mock('../collectors/config.js');
vi.mock('../collectors/features.js');
vi.mock('../collectors/license.js');
vi.mock('../collectors/metrics/api-requests.js');
vi.mock('../collectors/metrics/index.js');

// This is required because logger uses global env which is imported before the tests run. Can be
// reduce to just mock the file when logger is also using useLogger everywhere @TODO
vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
	}),
}));

let mockDb: Knex;
let mockSchema: SchemaOverview;

const distribution = { min: 0, max: 0, median: 0, mean: 0 };

const mockProject: TelemetryProject = {
	id: 'test-project-id',
	created_at: '2024-01-01T00:00:00.000Z',
	url: 'https://example.com',
	version: '11.0.0',
	templates_applied: [],
};

const mockConfig: TelemetryConfig = {
	auth: { providers: ['local'], issuers: [] },
	ai: { enabled: false, devtools: false, telemetry: { enabled: false, provider: null } },
	mcp: { enabled: false, oauth: { enabled: false, dcr: false, cimd: false } },
	assets: { transform_max_concurrent: 25, image_max_dimension: 6000, image_max_output_dimension: 6000 },
	cache: { enabled: false, store: 'redis', schema_freeze: false },
	cors: { enabled: false },
	database: { driver: 'postgres', version: '16.0' },
	email: { transport: 'smtp' },
	marketplace: { trust: 'sandbox' as const, registry: 'default' as const },
	extensions: {
		must_load: false,
		auto_reload: false,
		cache_ttl: null,
		limit: null,
		rolldown: false,
		storage_max_concurrency: 20,
	},
	files: { max_upload_size: null, import_max_file_size: '50mb' },
	flows: { run_script_timeout: 10000, run_script_max_memory: null },
	graphql: { introspection: true, single_use_mutations: 12 },
	healthcheck: { enabled: true },
	license: { key_management: true },
	openapi: { enabled: true },
	redis: { enabled: false },
	telemetry: { enabled: true, project_owner: true },
	storage: { drivers: ['local'] },
	retention: { enabled: false, activity: '90d', revisions: '90d', flow_logs: '90d' },
	websockets: { enabled: false, rest: false, graphql: false, logs: false },
	prometheus: { enabled: false },
	rate_limiting: { enabled: false, pressure: false, email: false, email_flows: false },
	synchronization: { store: 'memory' },
	pm2: { instances: 0 },
};

const mockFeatures: TelemetryFeatures = {
	mcp: {
		enabled: false,
		allow_deletes: false,
		system_prompt: false,
		prompts_collection: false,
		oauth: { enabled: false, dcr: false, cimd: false },
	},
	ai: {
		enabled: false,
		system_prompt: false,
		translation: { glossary: false, style_guide: false, default_model: null },
		providers: {
			openai: { api_key: false, models: { allowed: [], custom: { count: 0 } } },
			anthropic: { api_key: false, models: { allowed: [], custom: { count: 0 } } },
			google: { api_key: false, models: { allowed: [], custom: { count: 0 } } },
			openai_compatible: { api_key: false, base_url: false, name: false, headers: { count: 0 }, models: { count: 0 } },
		},
	},
	modules: {
		content: true,
		files: true,
		users: true,
		visual_editor: false,
		insights: true,
		settings: true,
		deployments: false,
	},
	visual_editor: { urls: { count: 0 } },
	files: { transformations: 'none', presets: { count: 0 } },
	collaborative_editing: { enabled: false },
	mapping: { mapbox_api_key: false, basemaps: { count: 0 } },
	image_editor: { custom_aspect_ratios: { count: 0 } },
	appearance: {
		project_color: false,
		project_logo: false,
		public_foreground: false,
		public_background: false,
		public_favicon: false,
		public_note: false,
		report_feature_url: false,
		report_bug_url: false,
		report_error_url: false,
		theme: {
			default_appearance: 'auto',
			default_light_theme: 'default',
			default_dark_theme: 'default',
			light_theme_customization: false,
			dark_theme_customization: false,
			custom_css: false,
		},
	},
	extensions: {
		installed: {
			registry: [],
		},
	},
	editing: { default_save_action: 'save-and-quit' },
	localization: { default_language: 'en-US' },
	public_registration: { enabled: false, verify_email: false, role: false, email_filter: false },
	storage: { default_folder: false },
	product_updates: { enabled: false },
};

const mockLicense: TelemetryLicense = {
	licensed: true,
	source: 'settings',
	status: 'active',
	invalid_reason: null,
	editable: true,
	name: 'Enterprise',
	version: '1',
	offline: false,
	issued_at: 1,
	expires_at: 2,
	renews_at: null,
	grace_period: 0,
	validation_interval: 0,
	overage_billed: { seats: 0, collections: 0, flows: 0 },
	entitlements: {
		seats: {
			limit: 10,
			overage: 0,
			addon: 0,
			hard_limit: 10,
			usage: 1,
			within_contract: true,
			within_hard_limit: true,
		},
		collections: {
			limit: 10,
			overage: 0,
			addon: 0,
			hard_limit: 10,
			usage: 1,
			within_contract: true,
			within_hard_limit: true,
		},
		flows: {
			limit: 10,
			overage: 0,
			addon: 0,
			hard_limit: 10,
			usage: 1,
			within_contract: true,
			within_hard_limit: true,
		},
		sso_enabled: true,
		offline_enabled: false,
		telemetry_required: true,
		custom_llms_enabled: false,
		custom_permission_rules_enabled: false,
		production_enabled: true,
		ai_translations_enabled: false,
		display_powered_by: 'HIDDEN',
		activity_historical_timeframe: null,
		revision_historical_timeframe: null,
	},
};

const extensionBreakdown = (): ExtensionBreakdown => {
	const bySource = { count: 0, source: { registry: { count: 0 }, local: { count: 0 }, module: { count: 0 } } };

	return {
		bundles: { ...bySource },
		individual: { ...bySource },
		type: {
			display: { ...bySource },
			interface: { ...bySource },
			module: { ...bySource },
			layout: { ...bySource },
			panel: { ...bySource },
			theme: { ...bySource },
			endpoint: { ...bySource },
			hook: { ...bySource },
			operation: { ...bySource },
			bundle: { ...bySource },
		},
	};
};

const mockMetrics: Omit<TelemetryMetrics, 'api_requests'> = {
	fields: { count: 0 },
	collections: {
		count: 0,
		shares: { ...distribution },
		fields: { ...distribution },
		items: { ...distribution },
		versioned: { count: 0, items: { ...distribution } },
		archive_app_filter: { count: 0, items: { ...distribution } },
		activity: {
			all: { count: 0, items: { ...distribution } },
			activity: { count: 0, items: { ...distribution } },
			none: { count: 0, items: { ...distribution } },
		},
	},
	shares: { count: 0 },
	items: { count: 0 },
	files: { count: 0, size: { sum: 0, ...distribution }, types: {} },
	users: { admin: { count: 0 }, app: { count: 0 }, api: { count: 0 } },
	database: { size: null },
	roles: {
		count: 0,
		users: { ...distribution },
		policies: { ...distribution },
		children: { ...distribution },
		depth: { ...distribution },
	},
	policies: { count: 0 },
	flows: { active: { count: 0 }, inactive: { count: 0 } },
	operations: { count: 0, type: { custom: { count: 0 } } },
	relations: { count: 0 },
	permissions: { count: 0 },
	folders: { count: 0 },
	comments: { count: 0 },
	versions: { count: 0 },
	presets: { count: 0, bookmarks: { count: 0 } },
	deployments: { count: 0, provider: {}, projects: { count: 0 }, runs: { count: 0 } },
	oauth_clients: { count: 0, registration: {} },
	translations: { count: 0, language: { count: 0, translations: { ...distribution } } },
	dashboards: { count: 0, panels: { ...distribution } },
	panels: { count: 0 },
	extensions: { active: extensionBreakdown(), inactive: extensionBreakdown() },
};

const mockApiRequests: ApiRequestMetrics = {
	count: 3,
	cached: { count: 1 },
	method: {
		get: { count: 3 },
		search: { count: 0 },
		post: { count: 0 },
		put: { count: 0 },
		patch: { count: 0 },
		delete: { count: 0 },
	},
};

const cachedSections = {
	project: mockProject,
	license: mockLicense,
	config: mockConfig,
	features: mockFeatures,
	metrics: mockMetrics,
};

describe('getReport', () => {
	beforeEach(() => {
		mockDb = {} as unknown as Knex;
		mockSchema = {} as unknown as SchemaOverview;
		vi.mocked(useLogger).mockReturnValue({ warn: vi.fn() } as any);
		vi.mocked(getSystemCache).mockResolvedValue(undefined as any);
		vi.mocked(getDatabase).mockReturnValue(mockDb);
		vi.mocked(getSchema).mockResolvedValue(mockSchema);
		vi.mocked(collectProject).mockResolvedValue(mockProject);
		vi.mocked(collectConfig).mockResolvedValue(mockConfig);
		vi.mocked(collectFeatures).mockResolvedValue(mockFeatures);
		vi.mocked(collectLicense).mockResolvedValue(mockLicense);
		vi.mocked(collectMetrics).mockResolvedValue(mockMetrics);
		vi.mocked(collectApiRequestMetrics).mockResolvedValue(mockApiRequests);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('Returns structured report with all top-level sections', async () => {
		const report = await getReport();

		expect(report).toHaveProperty('event');
		expect(report).toHaveProperty('timestamp');
		expect(report).toHaveProperty('trigger');
		expect(report).toHaveProperty('project');
		expect(report).toHaveProperty('license');
		expect(report).toHaveProperty('config');
		expect(report).toHaveProperty('features');
		expect(report).toHaveProperty('metrics');
	});

	test('Calls all collectors with the database instance and schema', async () => {
		await getReport();

		expect(getSchema).toHaveBeenCalledWith({ database: mockDb });
		expect(collectProject).toHaveBeenCalledWith(mockDb, mockSchema);
		expect(collectConfig).toHaveBeenCalledWith(mockDb);
		expect(collectFeatures).toHaveBeenCalledWith(mockDb, mockSchema);
		expect(collectMetrics).toHaveBeenCalledWith(mockDb, mockSchema);
	});

	test('Defaults trigger to scheduled', async () => {
		const report = await getReport();
		expect(report.trigger).toBe('scheduled');
	});

	test('Forwards custom trigger', async () => {
		const report = await getReport('startup');
		expect(report.trigger).toBe('startup');
	});

	test('Returns project section from collectProject', async () => {
		const report = await getReport();
		expect(report.project).toEqual(mockProject);
	});

	test('Returns meta keys with correct structure', async () => {
		const report = await getReport();

		expect(report.event).toBe('directus.telemetry.ping.v2');
		expect(report.timestamp).toEqual(expect.any(String));
		expect(report.trigger).toBe('scheduled');
	});

	test('Returns license section from collectLicense', async () => {
		const report = await getReport();
		expect(report.license).toEqual(mockLicense);
	});

	test('Nulls the license section instead of failing the report when collectLicense throws', async () => {
		vi.mocked(collectLicense).mockRejectedValue(new Error('license server unreachable'));

		const report = await getReport();

		expect(report.license).toBeNull();
		expect(report.project).toEqual(mockProject);
	});

	test('Returns config section from collectConfig', async () => {
		const report = await getReport();
		expect(report.config).toEqual(mockConfig);
	});

	test('Returns features section from collectFeatures', async () => {
		const report = await getReport();
		expect(report.features).toEqual(mockFeatures);
	});

	test('Returns metrics section from collectMetrics plus the API request counts', async () => {
		const report = await getReport();
		expect(report.metrics).toEqual({ ...mockMetrics, api_requests: mockApiRequests });
	});

	test('Nulls the features section instead of failing the report when collectFeatures throws', async () => {
		vi.mocked(collectFeatures).mockRejectedValue(new Error('no connection'));

		const report = await getReport();

		expect(report.features).toBeNull();
		expect(report.project).toEqual(mockProject);
	});

	test('Nulls api_requests instead of failing the report when the counter is unreachable', async () => {
		vi.mocked(collectApiRequestMetrics).mockRejectedValue(new Error('no connection'));

		const report = await getReport();

		expect(report.metrics.api_requests).toBeNull();
	});

	test('Returns cached sections when the system cache has a report', async () => {
		vi.mocked(getSystemCache).mockResolvedValue(cachedSections as any);

		const report = await getReport('scheduled');

		expect(collectProject).not.toHaveBeenCalled();
		expect(collectConfig).not.toHaveBeenCalled();
		expect(collectFeatures).not.toHaveBeenCalled();
		expect(collectLicense).not.toHaveBeenCalled();
		expect(collectMetrics).not.toHaveBeenCalled();
		expect(report.trigger).toBe('scheduled');
		expect(report.project).toEqual(mockProject);
	});

	test('Stamps a fresh timestamp on cached reports', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));

		try {
			vi.mocked(getSystemCache).mockResolvedValue(cachedSections as any);

			const report = await getReport();

			expect(report.timestamp).toBe('2025-06-01T12:00:00.000Z');
		} finally {
			vi.useRealTimers();
		}
	});

	test('Collects API request counts on cached reports so the counters still drain', async () => {
		vi.mocked(getSystemCache).mockResolvedValue(cachedSections as any);

		const report = await getReport();

		expect(collectApiRequestMetrics).toHaveBeenCalledOnce();
		expect(report.metrics.api_requests).toEqual(mockApiRequests);
	});

	test('Stores the collected sections in the system cache, without the drained counters', async () => {
		await getReport();

		expect(setSystemCache).toHaveBeenCalledWith('telemetry-report', cachedSections, 15 * 60 * 1000);
	});
});
