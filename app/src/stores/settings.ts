import api from '@/api';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import { Settings } from '@directus/shared/types';

export const useSettingsStore = defineStore({
	id: 'settingsStore',
	state: () => ({
		settings: null as null | Settings,
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/settings`);
			this.settings = response.data.data;
		},

		async dehydrate() {
			this.$reset();
		},

		async updateSettings(updates: { [key: string]: any }) {
			const settingsCopy = { ...(this.settings as Settings) };
			const newSettings = merge({}, this.settings, updates);

			this.settings = newSettings;

			try {
				const response = await api.patch(`/settings`, updates);

				this.settings = response.data.data;

				notify({
					title: i18n.global.t('settings_update_success'),
					type: 'success',
				});
			} catch (err: any) {
				this.settings = settingsCopy;
				unexpectedError(err);
			}
		},
	},
});
