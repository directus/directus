import api, { replaceQueue } from '@/api';
import { AUTH_SSO_DRIVERS, DEFAULT_AUTH_DRIVER, DEFAULT_AUTH_PROVIDER } from '@/constants';
import { i18n } from '@/lang';
import { AuthProvider } from '@/types/login';
import formatTitle from '@directus/format-title';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, reactive } from 'vue';

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
		  };
	version?: string;
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
		setupCompleted: false,
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

	const hydrate = async () => {
		const [serverInfoResponse, authResponse] = await Promise.all([
			api.get(`/server/info`),
			api.get('/auth?sessionOnly'),
		]);

		info.project = serverInfoResponse.data.data?.project;
		info.mcp_enabled = serverInfoResponse.data.data?.mcp_enabled;
		info.setupCompleted = serverInfoResponse.data.data?.setupCompleted;
		info.queryLimit = serverInfoResponse.data.data?.queryLimit;
		info.extensions = serverInfoResponse.data.data?.extensions;
		info.websocket = serverInfoResponse.data.data?.websocket;
		info.version = serverInfoResponse.data.data?.version;
		info.uploads = serverInfoResponse.data.data?.uploads;

		auth.providers = authResponse.data.data;
		auth.disableDefault = authResponse.data.disableDefault;

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

	const dehydrate = () => {
		info.project = null;

		auth.providers = [];
		auth.disableDefault = false;
	};

	return { info, auth, providerOptions, hydrate, dehydrate };
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useServerStore, import.meta.hot));
}
