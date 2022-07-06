import api from '@/api';
import { AUTH_SSO_DRIVERS, DEFAULT_AUTH_PROVIDER } from '@/constants';
import { setLanguage } from '@/lang/set-language';
import formatTitle from '@directus/format-title';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, reactive, ref, unref } from 'vue';
import { i18n } from '@/lang';

type Info = {
	project: null | {
		project_name: string | null;
		project_descriptor: string | null;
		project_logo: string | null;
		project_color: string | null;
		default_language: string | null;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string | null;
		custom_css: string | null;
	};
	directus?: {
		version: string;
	};
	node?: {
		version: string;
		uptime: number;
	};
	os?: {
		type: string;
		version: string;
		uptime: number;
		totalmem: number;
	};
};

type Auth = {
	providers: { driver: string; name: string }[];
	disableDefault: boolean;
};

export const useServerStore = defineStore('serverStore', () => {
	const info = reactive<Info>({
		project: null,
		directus: undefined,
		node: undefined,
		os: undefined,
	});

	const auth = reactive<Auth>({
		providers: [],
		disableDefault: false,
	});

	const providerOptions = computed(() => {
		const options = auth.providers
			.filter((provider) => !AUTH_SSO_DRIVERS.includes(provider.driver))
			.map((provider) => ({ text: formatTitle(provider.name), value: provider.name }));

		if (!auth.disableDefault) {
			options.unshift({ text: i18n.global.t('default_provider'), value: DEFAULT_AUTH_PROVIDER });
		}

		return options;
	});

	const hydrate = async () => {
		const [serverInfoResponse, authResponse] = await Promise.all([
			api.get(`/server/info`, { params: { limit: -1 } }),
			api.get('/auth'),
		]);

		info.project = serverInfoResponse.data.data?.project;
		info.directus = serverInfoResponse.data.data?.directus;
		info.node = serverInfoResponse.data.data?.node;
		info.os = serverInfoResponse.data.data?.os;

		auth.providers = authResponse.data.data;
		auth.disableDefault = authResponse.data.disableDefault;

		await setLanguage(unref(info)?.project?.default_language ?? 'en-US');
	};

	const dehydrate = () => {
		info.project = null;
		info.directus = undefined;
		info.node = undefined;
		info.os = undefined;

		auth.providers = [];
		auth.disableDefault = false;
	};

	return { info, auth, providerOptions, hydrate, dehydrate };
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useServerStore, import.meta.hot));
}
