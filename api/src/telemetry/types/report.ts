/**
 * Telemetry Report v1
 *
 * Structured telemetry payload sent to the intake server. All data is anonymous —
 * no PII, credentials, or user-specific content is included. Boolean flags for API keys
 * indicate *presence* only. Statistics use min/max/median/mean summaries to avoid
 * transmitting per-row data.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Four-number distribution summary used throughout metrics. */
export interface DistributionSummary {
	min: number;
	max: number;
	median: number;
	mean: number;
}

/** Count wrapper — keeps the shape consistent across the report. */
export interface CountMetric {
	count: number;
}

/** Count + size distribution for a MIME group. */
export interface FileSizeByType extends CountMetric {
	size: DistributionSummary;
}

/** Count + source breakdown. */
export interface ExtensionCountBySource extends CountMetric {
	source: {
		registry: CountMetric;
		local: CountMetric;
		module: CountMetric;
	};
}

/** Aggregate breakdown for an extension state (active / inactive). */
export interface ExtensionBreakdown {
	/** Counts bundles as one item, ignores bundle children. */
	bundles: ExtensionCountBySource;
	/** Counts individual extensions (bundle children), ignores bundle parents. */
	individual: ExtensionCountBySource;
	type: {
		// App extensions
		display: ExtensionCountBySource;
		interface: ExtensionCountBySource;
		module: ExtensionCountBySource;
		layout: ExtensionCountBySource;
		panel: ExtensionCountBySource;
		theme: ExtensionCountBySource;
		// API extensions
		endpoint: ExtensionCountBySource;
		hook: ExtensionCountBySource;
		operation: ExtensionCountBySource;
		// Bundles
		bundle: ExtensionCountBySource;
	};
}

// ---------------------------------------------------------------------------
// Top-level sections
// ---------------------------------------------------------------------------

export interface TelemetryReport {
	project: TelemetryProject;
	meta: TelemetryMeta;
	config: TelemetryConfig;
	features: TelemetryFeatures;
	metrics: TelemetryMetrics;
}

// ---------------------------------------------------------------------------
// project
// ---------------------------------------------------------------------------

export interface TelemetryProject {
	/** UUID v7 project identifier (from directus_settings.project_id). */
	id: string;
	/** ISO-8601 timestamp derived from the UUID v7 time component. */
	created_at: string;
	/** Directus semver version string. */
	version: string;
	/** Project templates that have been applied (e.g. ["cms"]). */
	templates_applied: string[];
}

// ---------------------------------------------------------------------------
// meta
// ---------------------------------------------------------------------------

export interface TelemetryMeta {
	/** Schema version of this telemetry format. */
	version: number;
	/** ISO-8601 timestamp of when the report was generated. */
	timestamp: string;
	/** What triggered the report: "startup" | "scheduled". */
	trigger: 'startup' | 'scheduled';
}

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------

export interface TelemetryConfig {
	auth: {
		/** Configured auth provider driver names (e.g. ["local","oauth2"]). */
		providers: string[];
		/** Inferred identity provider issuers (e.g. ["google","azure"]). */
		issuers: string[];
	};
	/** Whether AI chat is enabled via env. */
	ai: boolean;
	/** Whether MCP is enabled via env. */
	mcp: boolean;
	cache: {
		enabled: boolean;
		/** Cache store type (e.g. "redis", "memory"). */
		store: string;
	};
	database: {
		/** Knex client name (e.g. "postgres", "sqlite3"). */
		driver: string;
		/** Raw database version string. */
		version: string | null;
	};
	email: {
		/** Email transport (e.g. "smtp", "sendgrid"). */
		transport: string;
	};
	marketplace: {
		/** Extension sandbox trust mode. */
		trust: 'sandbox' | 'all';
		/** Whether the default public registry or a custom one is configured. */
		registry: 'default' | 'custom';
	};
	extensions: {
		must_load: boolean;
		auto_reload: boolean;
		cache_ttl: string | false;
		limit: number | false;
		rolldown: boolean;
	};
	storage: {
		/** Unique storage driver names configured. */
		drivers: string[];
	};
	retention: {
		enabled: boolean;
		activity: string | false;
		revisions: string | false;
		flow_logs: string | false;
	};
	websockets: {
		enabled: boolean;
		rest: boolean;
		graphql: boolean;
		logs: boolean;
	};
	prometheus: {
		/** Whether Prometheus metrics endpoint is enabled. */
		enabled: boolean;
	};
	rate_limiting: {
		enabled: boolean;
		pressure: boolean;
		email: boolean;
		email_flows: boolean;
	};
	synchronization: {
		/** Sync store type (e.g. "redis", "memory"). */
		store: string;
	};
	pm2: {
		/** Number of PM2 instances (from PM2_INSTANCES env var). */
		instances: number;
	};
}

// ---------------------------------------------------------------------------
// features  (derived from directus_settings – never exposes secrets)
// ---------------------------------------------------------------------------

export interface TelemetryFeatures {
	mcp: {
		enabled: boolean;
		allow_deletes: boolean;
		system_prompt: boolean;
	};
	ai: {
		enabled: boolean;
		/** Whether a custom AI system prompt is set. */
		system_prompt: boolean;
		providers: {
			openai: {
				api_key: boolean;
				models: {
					/** Known default models from the allowed list. */
					allowed: string[];
					/** Count of user-added models not in the default list. */
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
				headers: boolean;
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
		/** "all" | "none" | "presets" */
		transformations: string;
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
			/** Registry extensions with id and version (only when using the default public registry). */
			registry: Array<{ id: string; version: string }>;
		};
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

// ---------------------------------------------------------------------------
// metrics
// ---------------------------------------------------------------------------

export interface TelemetryMetrics {
	api_requests: {
		count: number;
		cached: CountMetric;
		method: {
			get: CountMetric;
			post: CountMetric;
			put: CountMetric;
			patch: CountMetric;
			delete: CountMetric;
		};
	};

	fields: CountMetric;

	collections: {
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
	};

	shares: CountMetric;

	items: CountMetric;

	files: {
		count: number;
		size: {
			sum: number;
			min: number;
			max: number;
			median: number;
			mean: number;
		};
		types: Record<string, FileSizeByType>;
	};

	users: {
		admin: CountMetric;
		app: CountMetric;
		api: CountMetric;
	};

	roles: {
		count: number;
		users: DistributionSummary;
		policies: DistributionSummary;
		roles: DistributionSummary;
	};

	policies: CountMetric;

	flows: {
		active: CountMetric;
		inactive: CountMetric;
	};

	translations: {
		count: number;
		language: {
			count: number;
			translations: DistributionSummary;
		};
	};

	dashboards: {
		count: number;
		panels: DistributionSummary;
	};

	panels: CountMetric;

	extensions: {
		active: ExtensionBreakdown;
		inactive: ExtensionBreakdown;
	};
}
