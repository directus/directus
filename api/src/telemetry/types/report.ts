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
	size: DistributionSummary;
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
	project: TelemetryProject;
	meta: TelemetryMeta;
	config: TelemetryConfig;
	features: TelemetryFeatures;
	metrics: TelemetryMetrics;
}

export interface TelemetryProject {
	id: string;
	created_at: string;
	version: string;
	templates_applied: string[];
}

export interface TelemetryMeta {
	version: number;
	timestamp: string;
	trigger: 'startup' | 'scheduled';
}

export interface TelemetryConfig {
	auth: {
		providers: string[];
		issuers: string[];
	};
	ai: boolean;
	mcp: boolean;
	cache: {
		enabled: boolean;
		store: string;
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
		cache_ttl: string | false;
		limit: number | false;
		rolldown: boolean;
	};
	storage: {
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
	};
	ai: {
		enabled: boolean;
		system_prompt: boolean;
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
