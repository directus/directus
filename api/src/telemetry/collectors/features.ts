import { DEFAULT_AI_MODELS } from '@directus/ai';
import { useEnv } from '@directus/env';
import type { SchemaOverview } from '@directus/types';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { SettingsService } from '../../services/settings.js';
import type { TelemetryReport } from '../types/report.js';
import { collectInstalledRegistryExtensions } from '../utils/collect-installed-registry-extensions.js';
import { countCustomModels } from '../utils/count-custom-models.js';
import { filterKnownArrayItems } from '../utils/filter-known-array-items.js';

type FeaturesInfo = TelemetryReport['features'];

interface FeatureSettingsResponse {
	mcp_enabled: boolean | null;
	mcp_allow_deletes: boolean | null;
	mcp_system_prompt_enabled: boolean | null;
	visual_editor_urls: Array<{ url: string }> | null;
	ai_openai_api_key: string | null;
	ai_google_api_key: string | null;
	ai_anthropic_api_key: string | null;
	ai_system_prompt: string | null;
	collaborative_editing_enabled: boolean | null;
	project_color: string | null;
	project_logo: string | null;
	public_foreground: string | null;
	public_background: string | null;
	public_favicon: string | null;
	public_note: string | null;
	report_feature_url: string | null;
	report_bug_url: string | null;
	report_error_url: string | null;
	default_appearance: string;
	default_theme_light: string;
	default_theme_dark: string;
	theme_light_overrides: Record<string, unknown> | null;
	theme_dark_overrides: Record<string, unknown> | null;
	custom_css: string | null;
	mapbox_key: string | null;
	basemaps: Array<Record<string, unknown>> | null;
	custom_aspect_ratios: Array<Record<string, unknown>> | null;
	storage_asset_presets: Array<Record<string, unknown>> | null;
	storage_asset_transform: string;
	ai_openai_compatible_api_key: string | null;
	ai_openai_compatible_base_url: string | null;
	ai_openai_compatible_name: string | null;
	ai_openai_compatible_models: string[] | null;
	ai_openai_compatible_headers: Record<string, string> | null;
	ai_openai_allowed_models: string[] | null;
	ai_anthropic_allowed_models: string[] | null;
	ai_google_allowed_models: string[] | null;
	module_bar: Array<{ type?: string; id?: string; enabled?: boolean }> | null;
}

export async function collectFeatures(db: Knex, schema: SchemaOverview): Promise<FeaturesInfo> {
	const env = useEnv();
	const settingsService = new SettingsService({ knex: db, schema });

	const settings = await settingsService.readSingleton({
		fields: [
			'mcp_enabled',
			'mcp_allow_deletes',
			'mcp_system_prompt_enabled',
			'visual_editor_urls',
			'ai_openai_api_key',
			'ai_google_api_key',
			'ai_anthropic_api_key',
			'ai_system_prompt',
			'collaborative_editing_enabled',
			'project_color',
			'project_logo',
			'public_foreground',
			'public_background',
			'public_favicon',
			'public_note',
			'report_feature_url',
			'report_bug_url',
			'report_error_url',
			'default_appearance',
			'default_theme_light',
			'default_theme_dark',
			'theme_light_overrides',
			'theme_dark_overrides',
			'custom_css',
			'mapbox_key',
			'basemaps',
			'custom_aspect_ratios',
			'storage_asset_presets',
			'storage_asset_transform',
			'ai_openai_compatible_api_key',
			'ai_openai_compatible_base_url',
			'ai_openai_compatible_name',
			'ai_openai_compatible_models',
			'ai_openai_compatible_headers',
			'ai_openai_allowed_models',
			'ai_anthropic_allowed_models',
			'ai_google_allowed_models',
			'module_bar',
		],
	}) as FeatureSettingsResponse;

	// Build sets of known model IDs per provider for whitelist filtering
	const knownModels: Record<string, Set<string>> = { openai: new Set(), anthropic: new Set(), google: new Set() };

	for (const m of DEFAULT_AI_MODELS) {
		if (m.provider in knownModels) {
			knownModels[m.provider]!.add(m.model);
		}
	}

	const visualEditorUrls = Array.isArray(settings?.['visual_editor_urls']) ? (settings['visual_editor_urls'] as unknown[]).length : 0;
	const assetPresets = Array.isArray(settings?.['storage_asset_presets']) ? (settings['storage_asset_presets'] as unknown[]).length : 0;
	const assetTransform = (settings?.['storage_asset_transform'] as string) ?? 'all';
	const basemapsCount = Array.isArray(settings?.['basemaps']) ? (settings['basemaps'] as unknown[]).length : 0;

	const aspectRatios = Array.isArray(settings?.['custom_aspect_ratios'])
		? (settings['custom_aspect_ratios'] as unknown[]).length
		: 0;

	// Detect enabled modules from module_bar setting
	const moduleBar = settings?.['module_bar'] ?? [];

	const enabledModuleIds = new Set(
		moduleBar
			.filter((m) => m.type === 'module' && m.enabled !== false)
			.map((m) => m.id),
	);

	return {
		mcp: {
			enabled: toBoolean(settings?.['mcp_enabled'] ?? false),
			allow_deletes: toBoolean(settings?.['mcp_allow_deletes'] ?? false),
			system_prompt: toBoolean(settings?.['mcp_system_prompt_enabled'] ?? false),
		},
		ai: {
			enabled: toBoolean(env['AI_ENABLED'] ?? false),
			system_prompt: Boolean(settings?.['ai_system_prompt']),
			providers: {
				openai: {
					api_key: Boolean(settings?.['ai_openai_api_key']),
					models: {
						allowed: filterKnownArrayItems(settings?.['ai_openai_allowed_models'], knownModels['openai']!),
						custom: { count: countCustomModels(settings?.['ai_openai_allowed_models'], knownModels['openai']!) },
					},
				},
				anthropic: {
					api_key: Boolean(settings?.['ai_anthropic_api_key']),
					models: {
						allowed: filterKnownArrayItems(settings?.['ai_anthropic_allowed_models'], knownModels['anthropic']!),
						custom: { count: countCustomModels(settings?.['ai_anthropic_allowed_models'], knownModels['anthropic']!) },
					},
				},
				google: {
					api_key: Boolean(settings?.['ai_google_api_key']),
					models: {
						allowed: filterKnownArrayItems(settings?.['ai_google_allowed_models'], knownModels['google']!),
						custom: { count: countCustomModels(settings?.['ai_google_allowed_models'], knownModels['google']!) },
					},
				},
				openai_compatible: {
					api_key: Boolean(settings?.['ai_openai_compatible_api_key']),
					base_url: Boolean(settings?.['ai_openai_compatible_base_url']),
					name: Boolean(settings?.['ai_openai_compatible_name']),
					headers: Boolean(settings?.['ai_openai_compatible_headers']),
					models: {
						count: Array.isArray(settings?.['ai_openai_compatible_models'])
							? (settings['ai_openai_compatible_models'] as unknown[]).length
							: 0,
					},
				},
			},
		},
		modules: {
			content: enabledModuleIds.has('content') || enabledModuleIds.size === 0,
			files: enabledModuleIds.has('files') || enabledModuleIds.size === 0,
			users: enabledModuleIds.has('users') || enabledModuleIds.size === 0,
			visual_editor: enabledModuleIds.has('visual'),
			insights: enabledModuleIds.has('insights') || enabledModuleIds.size === 0,
			settings: enabledModuleIds.has('settings') || enabledModuleIds.size === 0,
			deployments: enabledModuleIds.has('deployments'),
		},
		visual_editor: {
			urls: { count: visualEditorUrls },
		},
		files: {
			transformations: assetTransform,
			presets: { count: assetPresets },
		},
		collaborative_editing: {
			enabled: toBoolean(settings?.['collaborative_editing_enabled'] ?? false),
		},
		mapping: {
			mapbox_api_key: Boolean(settings?.['mapbox_key']),
			basemaps: { count: basemapsCount },
		},
		image_editor: {
			custom_aspect_ratios: { count: aspectRatios },
		},
		extensions: {
			installed: {
				registry: await collectInstalledRegistryExtensions(db, schema, env),
			},
		},
		appearance: {
			project_color: Boolean(settings?.['project_color']),
			project_logo: Boolean(settings?.['project_logo']),
			public_foreground: Boolean(settings?.['public_foreground']),
			public_background: Boolean(settings?.['public_background']),
			public_favicon: Boolean(settings?.['public_favicon']),
			public_note: Boolean(settings?.['public_note']),
			report_feature_url: Boolean(settings?.['report_feature_url']),
			report_bug_url: Boolean(settings?.['report_bug_url']),
			report_error_url: Boolean(settings?.['report_error_url']),
			theme: {
				default_appearance: (settings?.['default_appearance'] as string) ?? 'auto',
				default_light_theme: (settings?.['default_theme_light'] as string) ?? 'default',
				default_dark_theme: (settings?.['default_theme_dark'] as string) ?? 'default',
				light_theme_customization: Boolean(settings?.['theme_light_overrides']),
				dark_theme_customization: Boolean(settings?.['theme_dark_overrides']),
				custom_css: Boolean(settings?.['custom_css']),
			},
		},
	};
}


