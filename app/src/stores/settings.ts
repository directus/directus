import api from '@/api';
import { i18n } from '@/lang';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { merge } from 'lodash';
import { defineStore } from 'pinia';
import { Settings } from '@directus/shared/types';
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

			const response = await api.get(`/settings`, {
				params: {
					fields: [
						'project_name',
						'project_url',
						'project_color',
						'project_logo',
						'public_foreground',
						'public_background',
						'public_note',
						'auth_login_attempts',
						'auth_password_policy',
						'storage_asset_transform',
						'storage_asset_presets',
						'custom_css',
						'storage_default_folder',
						'basemaps',
						'mapbox_key',
						'module_bar',
						'project_descriptor',
						'default_language',
						'custom_aspect_ratios',
						'image_editor',
					],
				},
			});
			this.settings = response.data.data;
		},

		async dehydrate() {
			this.$reset();
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
			} catch (err: any) {
				this.settings = settingsCopy;
				unexpectedError(err);
			}
		},

		async fetchRawTranslationStrings(lang: string) {
			const response = await api.get(`/settings`, {
				params: {
					fields: ['translations'],
					alias: {
						translations: 'json(translation_strings$[*])',
					},
					deep: {
						translations: {
							_filter: {
								'$.lang': { _eq: lang },
							},
						},
					},
				},
			});
			return response.data.data?.translations ?? [];
		},
	},
});
