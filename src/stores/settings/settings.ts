import { createStore } from 'pinia';
import { Setting } from './types';
import { keyBy, mapValues } from 'lodash';
import api from '@/api';
import useProjectsStore from '@/stores/projects';
import notify from '@/utils/notify';
import { i18n } from '@/lang';

/**
 * @NOTE
 *
 * The settings store also updates the current project in the projects store
 * this allows settings like project color and name to be reflected in the app
 * immediately.
 */

export const useSettingsStore = createStore({
	id: 'settingsStore',
	state: () => ({
		settings: [] as Setting[],
	}),
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const response = await api.get(`/${currentProjectKey}/settings`, {
				params: {
					limit: -1,
				},
			});

			this.state.settings = response.data.data;
		},
		async dehydrate() {
			this.reset();
		},

		async updateSettings(updates: { [key: string]: any }) {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;
			const settingsCopy = [...this.state.settings];

			const settingsToBeSaved = Object.keys(updates).map((key) => {
				const existing = this.state.settings.find((setting) => setting.key === key);

				if (existing === undefined) {
					throw new Error(`Setting with key '${key}' doesn't exist.`);
				}

				const { id } = existing;

				return {
					id: id,
					value: updates[key],
				};
			});

			this.state.settings = this.state.settings.map((existingSetting) => {
				const updated = settingsToBeSaved.find((update) => update.id === existingSetting.id);

				if (updated !== undefined) {
					return {
						...existingSetting,
						value: updated.value,
					};
				}

				return existingSetting;
			});

			try {
				const response = await api.patch(`/${currentProjectKey}/settings`, settingsToBeSaved);

				this.state.settings = this.state.settings.map((setting) => {
					const updated = response.data.data.find((update: any) => update.id === setting.id);

					if (updated !== undefined) {
						return {
							...setting,
							value: updated.value,
						};
					}

					return setting;
				});

				notify({
					title: i18n.t('settings_update_success'),
					text: Object.keys(updates).join(', '),
					type: 'success',
				});

				this.updateProjectsStore();
			} catch (error) {
				this.state.settings = settingsCopy;

				notify({
					title: i18n.t('settings_update_failed'),
					text: Object.keys(updates).join(', '),
					type: 'error',
				});
			}
		},
		async updateProjectsStore() {
			const projectsStore = useProjectsStore();
			await projectsStore.getProjects();
		},
	},
	getters: {
		formatted(state) {
			return mapValues(keyBy(state.settings, 'key'), 'value');
		},
	},
});
