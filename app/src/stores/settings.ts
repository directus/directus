import api from '@/api';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { OwnerInformation, Settings } from '@directus/types';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import { useUserStore } from './user';

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
});
