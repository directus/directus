import { createStore } from 'pinia';
import api from '@/api';
import notify from '@/utils/notify';
import { i18n } from '@/lang';
import { merge } from 'lodash';

export const useSettingsStore = createStore({
	id: 'settingsStore',
	state: () => ({
		settings: null as null | Record<string, any>,
	}),
	actions: {
		async hydrate() {
			try {
				const response = await api.get(`/settings`, { params: { fields: ['*.*'] } });
				this.state.settings = response.data.data;
			} catch {}
		},

		async dehydrate() {
			this.reset();
		},

		async updateSettings(updates: { [key: string]: any }) {
			const settingsCopy = { ...this.state.settings };
			const newSettings = merge({}, this.state.settings, updates);

			this.state.settings = newSettings;

			try {
				const response = await api.patch(`/settings`, updates, { params: { fields: ['*.*'] } });

				this.state.settings = response.data.data;

				notify({
					title: i18n.t('settings_update_success'),
					type: 'success',
				});
			} catch (error) {
				this.state.settings = settingsCopy;

				notify({
					title: i18n.t('settings_update_failed'),
					text: Object.keys(updates).join(', '),
					type: 'error',
				});
			}
		},
	},
});
