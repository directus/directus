import type { SchemaOverview } from '@directus/types';
import { type Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getDatabase } from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { collectConfig } from '../collectors/config.js';
import { collectFeatures } from '../collectors/features.js';
import { collectMetrics } from '../collectors/metrics/index.js';
import { collectProject } from '../collectors/project.js';
import { getReport } from './get-report.js';

vi.mock('../../database/index.js');
vi.mock('../../utils/get-schema.js');
vi.mock('../collectors/project.js');
vi.mock('../collectors/config.js');
vi.mock('../collectors/features.js');
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

const mockProject = {
	id: 'test-project-id',
	created_at: '2024-01-01T00:00:00.000Z',
	version: '11.0.0',
	templates_applied: [],
	deployed_on: 'unknown',
	replicas: 1,
};

const mockConfig = {
	auth: { providers: ['local'], issuers: [] },
	ai: false,
	mcp: false,
	cache: { enabled: false, store: null },
	database: { driver: 'postgres', version: '16.0' },
	email: { transport: 'smtp' },
	marketplace: { trust: 'sandbox' as const, registry: 'default' as const },
	extensions: { must_load: false, auto_reload: false, cache_ttl: null, limit: null, rolldown: false },
	storage: { drivers: ['local'] },
	retention: { enabled: false, activity: null, revisions: null, flow_logs: null },
	websockets: { enabled: false, rest: false, graphql: false, logs: false },
	prometheus: { enabled: false },
	rate_limiting: { enabled: false, pressure: false, email: false, email_flows: false },
	synchronization: { store: null },
	pm2: { instances: 0 },
};

const mockFeatures = {
	mcp: { enabled: false, allow_deletes: false, system_prompt: false },
	ai: {
		enabled: false,
		system_prompt: false,
		providers: {
			openai: { api_key: false, models: { allowed: [], custom: { count: 0 } } },
			anthropic: { api_key: false, models: { allowed: [], custom: { count: 0 } } },
			google: { api_key: false, models: { allowed: [], custom: { count: 0 } } },
			openai_compatible: { api_key: false, base_url: false, name: false, headers: false, models: { count: 0 } },
		},
	},
	modules: { content: true, files: true, users: true, visual_editor: false, insights: true, settings: true, deployments: false },
	visual_editor: { urls: { count: 0 } },
	files: { transformations: 'none', presets: { count: 0 } },
	collaborative_editing: { enabled: false },
	mapping: { mapbox_api_key: false, basemaps: { count: 0 } },
	image_editor: { custom_aspect_ratios: { count: 0 } },
	appearance: {
		project_color: false, project_logo: false, public_foreground: false,
		public_background: false, public_favicon: false, public_note: false,
		report_feature_url: false, report_bug_url: false, report_error_url: false,
		theme: { default_appearance: 'auto', default_light_theme: 'default', default_dark_theme: 'default',
			light_theme_customization: false, dark_theme_customization: false, custom_css: false },
	},
	extensions: {
		installed: {
			registry: [],
		},
	},
};

const mockMetrics = {
	api_requests: { count: 0, cached: { count: 0 }, method: { get: { count: 0 }, post: { count: 0 }, put: { count: 0 }, patch: { count: 0 }, delete: { count: 0 } } },
	fields: { count: 0 },
	collections: {
		count: 0, shares: { min: 0, max: 0, median: 0, mean: 0 }, fields: { min: 0, max: 0, median: 0, mean: 0 }, items: { min: 0, max: 0, median: 0, mean: 0 },
		versioned: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
		archive_app_filter: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } },
		activity: { all: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } }, activity: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } }, none: { count: 0, items: { min: 0, max: 0, median: 0, mean: 0 } } },
	},
	shares: { count: 0 },
	items: { count: 0 },
	files: { count: 0, size: { sum: 0, min: 0, max: 0, median: 0, mean: 0 }, types: {} },
	users: { admin: { count: 0 }, app: { count: 0 }, api: { count: 0 } },
	roles: { count: 0, users: { min: 0, max: 0, median: 0, mean: 0 }, policies: { min: 0, max: 0, median: 0, mean: 0 }, roles: { min: 0, max: 0, median: 0, mean: 0 } },
	policies: { count: 0 },
	flows: { active: { count: 0 }, inactive: { count: 0 } },
	translations: { count: 0, language: { count: 0, translations: { min: 0, max: 0, median: 0, mean: 0 } } },
	dashboards: { count: 0, panels: { min: 0, max: 0, median: 0, mean: 0 } },
	panels: { count: 0 },
	extensions: (() => {
		const s = { count: 0, source: { registry: { count: 0 }, local: { count: 0 }, module: { count: 0 } } };

		const breakdown = {
			...s,
			bundles: { ...s },
			individual: { ...s },
			type: {
				display: { ...s }, interface: { ...s }, module: { ...s }, layout: { ...s },
				panel: { ...s }, theme: { ...s }, endpoint: { ...s }, hook: { ...s },
				operation: { ...s }, bundle: { ...s },
			},
		};

		return { active: { ...breakdown }, inactive: { ...breakdown } };
	})(),
};

beforeEach(() => {
	mockDb = {} as unknown as Knex;
	mockSchema = {} as unknown as SchemaOverview;
	vi.mocked(getDatabase).mockReturnValue(mockDb);
	vi.mocked(getSchema).mockResolvedValue(mockSchema);
	vi.mocked(collectProject).mockResolvedValue(mockProject);
	vi.mocked(collectConfig).mockResolvedValue(mockConfig);
	vi.mocked(collectFeatures).mockResolvedValue(mockFeatures);
	vi.mocked(collectMetrics).mockResolvedValue(mockMetrics);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns structured report with all five top-level sections', async () => {
	const report = await getReport();

	expect(report).toHaveProperty('project');
	expect(report).toHaveProperty('meta');
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

test('Defaults trigger to scheduled in meta', async () => {
	const report = await getReport();
	expect(report.meta.trigger).toBe('scheduled');
});

test('Forwards custom trigger to meta', async () => {
	const report = await getReport('startup');
	expect(report.meta.trigger).toBe('startup');
});

test('Returns project section from collectProject', async () => {
	const report = await getReport();
	expect(report.project).toEqual(mockProject);
});

test('Returns meta section with correct structure', async () => {
	const report = await getReport();

	expect(report.meta).toEqual({
		version: 1,
		timestamp: expect.any(String),
		trigger: 'scheduled',
	});
});

test('Returns config section from collectConfig', async () => {
	const report = await getReport();
	expect(report.config).toEqual(mockConfig);
});

test('Returns features section from collectFeatures', async () => {
	const report = await getReport();
	expect(report.features).toEqual(mockFeatures);
});

test('Returns metrics section from collectMetrics', async () => {
	const report = await getReport();
	expect(report.metrics).toEqual(mockMetrics);
});
