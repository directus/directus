import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { Settings } from '@directus/types';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { useSdk } from '@directus/composables';
import { readSettings, updateSettings } from '@directus/sdk';

export const useSettingsStore = defineStore({
	id: 'settingsStore',
	state: () => ({
		settings: null as null | Settings,
	}),
	actions: {
		async hydrate() {
			const sdk = useSdk();
			const userStore = useUserStore();
			if (!userStore.currentUser || 'share' in userStore.currentUser) return;

			this.settings = await sdk.request<Settings>(readSettings());
		},

		async dehydrate() {
			this.$reset();
		},

		async updateSettings(updates: { [key: string]: any }, notifyOnSuccess = true) {
			const settingsCopy = { ...(this.settings as Settings) };
			const newSettings = merge({}, this.settings, updates);
			const sdk = useSdk();

			this.settings = newSettings;

			try {
				this.settings = await sdk.request<Settings>(updateSettings(updates));

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
});
