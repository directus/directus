import formatTitle from '@directus/format-title';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import api, { replaceQueue } from '@/api';
import { AUTH_SSO_DRIVERS, DEFAULT_AUTH_DRIVER, DEFAULT_AUTH_PROVIDER } from '@/constants';
import { i18n } from '@/lang';
import { BrandingLabelKey, LicenseGraceType, LicenseSource, LicenseStatus, ServerInfoLicense } from '@/types/license';
import { AuthProvider } from '@/types/login';

export type Info = {
	project: null | {
		project_name: string | null;
		project_descriptor: string | null;
		project_logo: string | null;
		project_color: string | null;
		default_language: string | null;
		default_appearance: 'light' | 'dark' | 'auto';
		default_theme_light: string | null;
		default_theme_dark: string | null;
		theme_light_overrides: Record<string, unknown> | null;
		theme_dark_overrides: Record<string, unknown> | null;
		public_foreground: string | null;
		public_background: { id: string; type: string } | null;
		public_favicon: string | null;
		public_note: string | null;
		custom_css: string | null;
		public_registration: boolean | null;
		public_registration_verify_email: boolean | null;
	};
	mcp_enabled: boolean;
	ai_enabled: boolean;
	files?: {
		mimeTypeAllowList: string[];
	};
	setupCompleted: boolean;
	rateLimit?:
		| false
		| {
				points: number;
				duration: number;
		  };
	rateLimitGlobal?:
		| false
		| {
				points: number;
				duration: number;
		  };
	queryLimit?: {
		default: number;
		max: number;
	};
	websocket?:
		| false
		| {
				logs?:
					| false
					| {
							allowedLogLevels: Record<string, number>;
					  };
				rest?:
					| false
					| {
							authentication: string;
							path: string;
					  };
				graphql?:
					| false
					| {
							authentication: string;
							path: string;
					  };
				heartbeat?: boolean | number;
				collaborativeEditing?: boolean;
		  };
	version?: string;
	show_license_key_field?: boolean;
	license_source?: LicenseSource;
	branding_label_key?: BrandingLabelKey | null;
	license?: ServerInfoLicense | null;
	license_locked?: boolean;
	license_status?: LicenseStatus;
	license_grace_type?: LicenseGraceType;
	extensions?: {
		limit: number | null;
	};
	uploads?: {
		tus?: boolean;
		chunkSize?: number;
		maxConcurrency?: number;
	};
};

export type Auth = {
	providers: AuthProvider[];
	disableDefault: boolean;
};

export const useServerStore = defineStore('serverStore', () => {
	const info = reactive<Info>({
		project: null,
		mcp_enabled: true,
		ai_enabled: true,
		files: undefined,
		setupCompleted: false,
		show_license_key_field: true,
		license_source: null,
		branding_label_key: null,
		license: null,
		license_locked: false,
		license_status: 'inactive',
		license_grace_type: null,
		extensions: undefined,
		rateLimit: undefined,
		queryLimit: undefined,
		websocket: undefined,
		uploads: undefined,
	});

	const auth = reactive<Auth>({
		providers: [],
		disableDefault: false,
	});

	const providerOptions = computed(() => {
		const options = auth.providers
			.filter((provider) => !AUTH_SSO_DRIVERS.includes(provider.driver))
			.map((provider) => ({ text: formatTitle(provider.name), value: provider.name, driver: provider.driver }));

		if (!auth.disableDefault) {
			options.unshift({
				text: i18n.global.t('default_provider'),
				value: DEFAULT_AUTH_PROVIDER,
				driver: DEFAULT_AUTH_DRIVER,
			});
		}

		return options;
	});

	const hydrateInfo = async () => {
		const serverInfoResponse = await api.get(`/server/info`);

		info.project = serverInfoResponse.data.data?.project;
		info.mcp_enabled = serverInfoResponse.data.data?.mcp_enabled;
		info.ai_enabled = serverInfoResponse.data.data?.ai_enabled;
		info.files = serverInfoResponse.data.data?.files;
		info.setupCompleted = serverInfoResponse.data.data?.setupCompleted;
		info.show_license_key_field = serverInfoResponse.data.data?.show_license_key_field ?? true;
		info.license_source = serverInfoResponse.data.data?.license_source ?? null;
		info.branding_label_key = serverInfoResponse.data.data?.branding_label_key ?? null;
		info.license = serverInfoResponse.data.data?.license ?? null;
		info.license_locked = serverInfoResponse.data.data?.license_locked ?? false;
		info.license_status = serverInfoResponse.data.data?.license_status ?? 'inactive';
		info.license_grace_type = serverInfoResponse.data.data?.license_grace_type ?? null;
		info.queryLimit = serverInfoResponse.data.data?.queryLimit;
		info.extensions = serverInfoResponse.data.data?.extensions;
		info.websocket = serverInfoResponse.data.data?.websocket;
		info.version = serverInfoResponse.data.data?.version;
		info.uploads = serverInfoResponse.data.data?.uploads;

		if (serverInfoResponse.data.data?.rateLimit !== undefined) {
			if (serverInfoResponse.data.data?.rateLimit === false) {
				await replaceQueue();
			} else {
				const { duration, points } = serverInfoResponse.data.data.rateLimit;
				const intervalCap = 1;
				/** Interval for 1 point */
				const interval = Math.ceil((duration * 1000) / points);
				await replaceQueue({ intervalCap, interval });
			}
		}
	};

	const hydrateAuth = async () => {
		const authResponse = await api.get('/auth?sessionOnly');

		auth.providers = authResponse.data.data;
		auth.disableDefault = authResponse.data.disableDefault;
	};

	const hydrate = async () => {
		await Promise.all([hydrateInfo(), hydrateAuth()]);
	};

	const dehydrate = () => {
		info.project = null;
		info.show_license_key_field = true;
		info.license = null;
		info.license_source = null;
		info.branding_label_key = null;
		info.license_locked = false;
		info.license_status = 'inactive';
		info.license_grace_type = null;

		auth.providers = [];
		auth.disableDefault = false;
	};

	return { info, auth, providerOptions, hydrate, hydrateInfo, hydrateAuth, dehydrate };
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useServerStore, import.meta.hot));
}
