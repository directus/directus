import { createStore } from 'pinia';
import api from '@/api';
import { useNotificationsStore } from '@/stores';
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
				const response = await api.get(`/settings`);
				this.state.settings = response.data.data;
			} catch (err) {
				console.error(err);
			}
		},

		async dehydrate() {
			this.reset();
		},

		async updateSettings(updates: { [key: string]: any }) {
			const notify = useNotificationsStore();
			const settingsCopy = { ...this.state.settings };
			const newSettings = merge({}, this.state.settings, updates);

			this.state.settings = newSettings;

			try {
				const response = await api.patch(`/settings`, updates);

				this.state.settings = response.data.data;

				notify.add({
					title: i18n.t('settings_update_success'),
					type: 'success',
				});
			} catch (error) {
				this.state.settings = settingsCopy;
				notify.add({
					title: i18n.t('settings_update_failed'),
					type: 'error',
					dialog: true,
					error,
				});
			}
		},
	},
});
