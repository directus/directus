import type { AppEntitlements, InvalidLicenseStatus, LicenseSource, LicenseStatus } from '@directus/license';

export interface DistributionSummary {
	min: number;
	max: number;
	median: number;
	mean: number;
}

export interface CountMetric {
	count: number;
}

export interface FileSizeByType extends CountMetric {
	size: { sum: number } & DistributionSummary;
}

export interface ExtensionCountBySource extends CountMetric {
	source: {
		registry: CountMetric;
		local: CountMetric;
		module: CountMetric;
	};
}

export interface ExtensionBreakdown {
	bundles: ExtensionCountBySource;
	individual: ExtensionCountBySource;
	type: {
		display: ExtensionCountBySource;
		interface: ExtensionCountBySource;
		module: ExtensionCountBySource;
		layout: ExtensionCountBySource;
		panel: ExtensionCountBySource;
		theme: ExtensionCountBySource;
		endpoint: ExtensionCountBySource;
		hook: ExtensionCountBySource;
		operation: ExtensionCountBySource;
		bundle: ExtensionCountBySource;
	};
}

export interface TelemetryReport {
	event: string;
	revision: number;
	timestamp: string;
	trigger: 'startup' | 'scheduled';
	project: TelemetryProject;
	license: TelemetryLicense | null;
	config: TelemetryConfig;
	features: TelemetryFeatures | null;
	metrics: TelemetryMetrics;
}

export interface TelemetryProject {
	id: string;
	created_at: string;
	url: string | null;
	version: string;
	templates_applied: string[];
}

/**
 * A countable entitlement reported as both what the license grants and what the instance actually
 * uses. `limit` is the contracted allowance; `hard_limit` is what is enforced (limit + overage +
 * addon). Usage between the two is in billable overage; above `hard_limit` the instance is blocked.
 * `null` limits mean unlimited.
 */
export interface CountableEntitlement {
	limit: number | null;
	overage: number;
	addon: number;
	hard_limit: number | null;
	usage: number;
	within_contract: boolean;
	within_hard_limit: boolean;
}

export interface TelemetryLicense {
	licensed: boolean;
	source: LicenseSource;
	status: LicenseStatus;
	invalid_reason: InvalidLicenseStatus | null;
	editable: boolean;
	name: string;
	version: string;
	offline: boolean;
	issued_at: number | null;
	expires_at: number | null;
	renews_at: number | null;
	grace_period: number;
	validation_interval: number;
	overage_billed: {
		seats: number;
		collections: number;
		flows: number;
	};
	entitlements: {
		seats: CountableEntitlement;
		collections: CountableEntitlement;
		flows: CountableEntitlement;
		sso_enabled: boolean;
		offline_enabled: boolean;
		telemetry_required: boolean;
		custom_llms_enabled: boolean;
		custom_permission_rules_enabled: boolean;
		production_enabled: boolean;
		ai_translations_enabled: boolean;
		display_powered_by: AppEntitlements['display_powered_by'];
		activity_historical_timeframe: number | null;
		revision_historical_timeframe: number | null;
	};
}
export interface TelemetryConfig {
	auth: {
		providers: string[];
		issuers: string[];
	};
	ai: {
		enabled: boolean;
		devtools: boolean;
		telemetry: {
			enabled: boolean;
			provider: string | null;
		};
	};
	mcp: {
		enabled: boolean;
		oauth: {
			enabled: boolean;
			dcr: boolean;
			cimd: boolean;
		};
	};
	assets: {
		transform_max_concurrent: number | null;
		image_max_dimension: number | null;
		image_max_output_dimension: number | null;
	};
	cache: {
		enabled: boolean;
		store: string;
		schema_freeze: boolean;
	};
	cors: {
		enabled: boolean;
	};
	database: {
		driver: string;
		version: string | null;
	};
	email: {
		transport: string;
	};
	marketplace: {
		trust: 'sandbox' | 'all';
		registry: 'default' | 'custom';
	};
	extensions: {
		must_load: boolean;
		auto_reload: boolean;
		cache_ttl: string | null;
		limit: number | null;
		rolldown: boolean;
		storage_max_concurrency: number | null;
	};
	files: {
		max_upload_size: string | null;
		import_max_file_size: string | null;
	};
	flows: {
		run_script_timeout: number | null;
		run_script_max_memory: string | null;
	};
	graphql: {
		introspection: boolean;
		single_use_mutations: number;
	};
	healthcheck: {
		enabled: boolean;
	};
	license: {
		key_management: boolean;
	};
	openapi: {
		enabled: boolean;
	};
	redis: {
		enabled: boolean;
	};
	telemetry: {
		enabled: boolean;
		project_owner: boolean;
	};
	storage: {
		drivers: string[];
	};
	retention: {
		enabled: boolean;
		activity: string;
		revisions: string;
		flow_logs: string;
	};
	websockets: {
		enabled: boolean;
		rest: boolean;
		graphql: boolean;
		logs: boolean;
	};
	prometheus: {
		enabled: boolean;
	};
	rate_limiting: {
		enabled: boolean;
		pressure: boolean;
		email: boolean;
		email_flows: boolean;
	};
	synchronization: {
		store: string;
	};
	pm2: {
		instances: number;
	};
}

export interface TelemetryFeatures {
	mcp: {
		enabled: boolean;
		allow_deletes: boolean;
		system_prompt: boolean;
		prompts_collection: boolean;
		oauth: {
			enabled: boolean;
			dcr: boolean;
			cimd: boolean;
		};
	};
	ai: {
		enabled: boolean;
		system_prompt: boolean;
		translation: {
			glossary: boolean;
			style_guide: boolean;
			default_model: string | null;
		};
		providers: {
			openai: {
				api_key: boolean;
				models: {
					allowed: string[];
					custom: CountMetric;
				};
			};
			anthropic: {
				api_key: boolean;
				models: {
					allowed: string[];
					custom: CountMetric;
				};
			};
			google: {
				api_key: boolean;
				models: {
					allowed: string[];
					custom: CountMetric;
				};
			};
			openai_compatible: {
				api_key: boolean;
				base_url: boolean;
				name: boolean;
				headers: CountMetric;
				models: CountMetric;
			};
		};
	};
	modules: {
		content: boolean;
		files: boolean;
		users: boolean;
		visual_editor: boolean;
		insights: boolean;
		settings: boolean;
		deployments: boolean;
	};
	visual_editor: {
		urls: CountMetric;
	};
	files: {
		transformations: 'all' | 'none' | 'presets';
		presets: CountMetric;
	};
	collaborative_editing: {
		enabled: boolean;
	};
	mapping: {
		mapbox_api_key: boolean;
		basemaps: CountMetric;
	};
	image_editor: {
		custom_aspect_ratios: CountMetric;
	};
	extensions: {
		installed: {
			registry: Array<{ id: string; version: string }>;
		};
	};
	editing: {
		default_save_action: 'save-and-quit' | 'save-and-stay' | 'save-and-create-new' | null;
	};
	localization: {
		default_language: string | null;
	};
	public_registration: {
		enabled: boolean;
		verify_email: boolean;
		role: boolean;
		email_filter: boolean;
	};
	storage: {
		default_folder: boolean;
	};
	product_updates: {
		enabled: boolean;
	};
	appearance: {
		project_color: boolean;
		project_logo: boolean;
		public_foreground: boolean;
		public_background: boolean;
		public_favicon: boolean;
		public_note: boolean;
		report_feature_url: boolean;
		report_bug_url: boolean;
		report_error_url: boolean;
		theme: {
			default_appearance: string;
			default_light_theme: string;
			default_dark_theme: string;
			light_theme_customization: boolean;
			dark_theme_customization: boolean;
			custom_css: boolean;
		};
	};
}

export interface ApiRequestMetrics {
	count: number;
	cached: CountMetric;
	method: {
		get: CountMetric;
		search: CountMetric;
		post: CountMetric;
		put: CountMetric;
		patch: CountMetric;
		delete: CountMetric;
	};
}

export interface CollectionMetrics {
	count: number;
	shares: DistributionSummary;
	fields: DistributionSummary;
	items: DistributionSummary;
	versioned: {
		count: number;
		items: DistributionSummary;
	};
	archive_app_filter: {
		count: number;
		items: DistributionSummary;
	};
	activity: {
		all: { count: number; items: DistributionSummary };
		activity: { count: number; items: DistributionSummary };
		none: { count: number; items: DistributionSummary };
	};
}

export interface FileMetrics {
	count: number;
	size: {
		sum: number;
		min: number;
		max: number;
		median: number;
		mean: number;
	};
	types: Record<string, FileSizeByType>;
}

export interface UserMetrics {
	admin: CountMetric;
	app: CountMetric;
	api: CountMetric;
}

export interface DatabaseMetrics {
	size: number | null;
}

export interface RoleMetrics {
	count: number;
	users: DistributionSummary;
	policies: DistributionSummary;
	children: DistributionSummary;
	depth: DistributionSummary;
}

export interface OperationMetrics {
	count: number;
	type: Record<string, CountMetric>;
}

export interface DeploymentMetrics {
	count: number;
	provider: Record<string, CountMetric>;
	projects: CountMetric;
	runs: CountMetric;
}

export interface OAuthClientMetrics {
	count: number;
	registration: Record<string, CountMetric>;
}

export interface PresetMetrics {
	count: number;
	bookmarks: CountMetric;
}

export interface FlowMetrics {
	active: CountMetric;
	inactive: CountMetric;
}

export interface TranslationMetrics {
	count: number;
	language: {
		count: number;
		translations: DistributionSummary;
	};
}

export interface DashboardMetrics {
	count: number;
	panels: DistributionSummary;
}

export interface ExtensionMetrics {
	active: ExtensionBreakdown;
	inactive: ExtensionBreakdown;
}

export interface TelemetryMetrics {
	api_requests: ApiRequestMetrics | null;
	collections: CollectionMetrics | null;
	fields: CountMetric | null;
	shares: CountMetric | null;
	items: CountMetric | null;
	files: FileMetrics | null;
	users: UserMetrics | null;
	database: DatabaseMetrics | null;
	roles: RoleMetrics | null;
	policies: CountMetric | null;
	flows: FlowMetrics | null;
	operations: OperationMetrics | null;
	relations: CountMetric | null;
	permissions: CountMetric | null;
	folders: CountMetric | null;
	comments: CountMetric | null;
	versions: CountMetric | null;
	presets: PresetMetrics | null;
	deployments: DeploymentMetrics | null;
	oauth_clients: OAuthClientMetrics | null;
	translations: TranslationMetrics | null;
	dashboards: DashboardMetrics | null;
	panels: CountMetric | null;
	extensions: ExtensionMetrics | null;
}
