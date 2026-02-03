import { OwnerInformation, Settings } from '@directus/types';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import { useUserStore } from './user';
import api from '@/api';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

export const useSettingsStore = defineStore({
	id: 'settingsStore',
	state: () => ({
		settings: null as null | Settings,
	}),
	actions: {
		async hydrate() {
			const userStore = useUserStore();
			if (!userStore.currentUser || 'share' in userStore.currentUser) return;

			const response = await api.get(`/settings`);
			this.settings = response.data.data;
		},

		async dehydrate() {
			this.$reset();
		},

		async setOwner(owner: OwnerInformation) {
			try {
				await api.post(`/settings/owner`, owner);
			} catch (error) {
				unexpectedError(error);
			}
		},

		async updateSettings(updates: { [key: string]: any }, notifyOnSuccess = true) {
			const settingsCopy = { ...(this.settings as Settings) };
			const newSettings = merge({}, this.settings, updates);

			this.settings = newSettings;

			try {
				const response = await api.patch(`/settings`, updates);

				this.settings = response.data.data;

				if (notifyOnSuccess) {
					notify({
						title: i18n.global.t('settings_update_success'),
					});
				}
			} catch (error) {
				this.settings = settingsCopy;
				unexpectedError(error);
			}
		},
	},
	getters: {
		availableAiProviders(): string[] {
			const providers: string[] = [];

			if (this.settings?.ai_openai_api_key) {
				providers.push('openai');
			}

			if (this.settings?.ai_anthropic_api_key) {
				providers.push('anthropic');
			}

			if (this.settings?.ai_google_api_key) {
				providers.push('google');
			}

			if (this.settings?.ai_openai_compatible_api_key && this.settings?.ai_openai_compatible_base_url) {
				providers.push('openai-compatible');
			}

			return providers;
		},
	},
});
