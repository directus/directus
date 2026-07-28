import type { MergeCoreCollection } from '../index.js';
import type { DirectusFolder } from './folder.js';

export type DirectusSettings<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_settings',
	{
		id: 1;
		project_name: string;
		project_url: string;
		report_error_url: string | null;
		report_bug_url: string | null;
		report_feature_url: string | null;
		project_color: string | null;
		project_logo: string | null;
		public_foreground: string | null;
		public_background: { id: string; type: string } | null;
		public_note: string | null;
		auth_login_attempts: number;
		auth_password_policy: string | null;
		storage_asset_transform: 'all' | 'none' | 'presets';
		storage_asset_presets:
			| {
					fit: string;
					height: number;
					width: number;
					quality: number;
					key: string;
					withoutEnlargement: boolean;
			  }[]
			| null;
		custom_css: string | null;
		storage_default_folder: DirectusFolder<Schema> | string | null;
		basemaps: Record<string, any> | null;
		mapbox_key: string | null;
		module_bar: 'json' | null;
		project_descriptor: string | null;
		default_language: string;
		custom_aspect_ratios: Record<string, any> | null;
		project_id: string | null;
		visual_editor_urls: Array<{ url: string }> | null;
		default_appearance: 'auto' | 'light' | 'dark';
		default_theme_light: string | null;
		default_theme_dark: string | null;
		theme_light_overrides: Record<string, unknown> | null;
		theme_dark_overrides: Record<string, unknown> | null;
		ai_openai_api_key: '**********' | null;
		ai_anthropic_api_key: '**********' | null;
		ai_google_api_key: '**********' | null;
		ai_openai_compatible_api_key: '**********' | null;
		ai_openai_compatible_base_url: string | null;
		ai_openai_compatible_name: string | null;
		ai_openai_compatible_models: Record<string, any>[] | null;
		ai_openai_compatible_headers: Record<string, any>[] | null;
		ai_openai_allowed_models: string[] | null;
		ai_anthropic_allowed_models: string[] | null;
		ai_google_allowed_models: string[] | null;
		ai_system_prompt: string | null;
		ai_translation_default_model: string | null;
		ai_translation_glossary: Array<{ term: string; translation_note?: string }> | null;
		ai_translation_style_guide: string | null;
		mcp_enabled: boolean;
		mcp_allow_deletes: boolean;
		mcp_prompts_collection: string | null;
		mcp_system_prompt_enabled: boolean;
		mcp_system_prompt: string | null;
		collaborative_editing_enabled: boolean;
		license_key: string | null;
		license_token: string | null;
	}
>;
