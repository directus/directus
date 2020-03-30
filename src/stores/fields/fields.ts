import { createStore } from 'pinia';
import { FieldRaw, Field } from './types';
import api from '@/api';
import { useProjectsStore } from '@/stores/projects';
import VueI18n from 'vue-i18n';
import { notEmpty } from '@/utils/is-empty/';
import { i18n } from '@/lang';
import formatTitle from '@directus/format-title';
import notify from '@/utils/notify';

export const useFieldsStore = createStore({
	id: 'fieldsStore',
	state: () => ({
		fields: [] as Field[],
	}),
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const response = await api.get(`/${currentProjectKey}/fields`);

			const fields: FieldRaw[] = response.data.data;

			this.state.fields = fields.map((field) => {
				let name: string | VueI18n.TranslateResult;

				if (notEmpty(field.translation)) {
					for (let i = 0; i < field.translation.length; i++) {
						const { locale, translation } = field.translation[i];

						i18n.mergeLocaleMessage(locale, {
							fields: {
								[field.field]: translation,
							},
						});
					}

					name = i18n.t(`fields.${field.field}`);
				} else {
					name = formatTitle(field.field);
				}

				return {
					...field,
					name,
				};
			});
		},
		async dehydrate() {
			this.reset();
		},
		async updateField(
			collectionKey: string,
			fieldKey: string,
			updates: Record<string, Partial<Field>>
		) {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const stateClone = [...this.state.fields];

			// Update locally first, so the changes are visible immediately
			this.state.fields = this.state.fields.map((field) => {
				if (field.collection === collectionKey && field.field === fieldKey) {
					return {
						...field,
						...updates,
					};
				}

				return field;
			});

			// Save to API, and update local state again to make sure everything is in sync with the
			// API
			try {
				const response = await api.patch(
					`/${currentProjectKey}/fields/${collectionKey}/${fieldKey}`,
					updates
				);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey && field.field === fieldKey) {
						return response.data.data;
					}

					return field;
				});

				notify({
					title: i18n.t('field_update_success', { field: fieldKey }),
					type: 'success',
				});
			} catch (error) {
				notify({
					title: i18n.t('field_update_failure', { field: fieldKey }),
					type: 'error',
				});

				// reset the changes if the api sync failed
				this.state.fields = stateClone;
				throw error;
			}
		},
		async updateFields(collectionKey: string, updates: Partial<Field>[]) {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;
			const stateClone = [...this.state.fields];

			// Update locally first, so the changes are visible immediately
			this.state.fields = this.state.fields.map((field) => {
				if (field.collection === collectionKey) {
					const updatesForThisField = updates.find(
						(update) => update.field === field.field
					);

					if (updatesForThisField) {
						return {
							...field,
							...updatesForThisField,
						};
					}
				}

				return field;
			});

			try {
				// Save to API, and update local state again to make sure everything is in sync with the
				// API
				const response = await api.patch(
					`/${currentProjectKey}/fields/${collectionKey}`,
					updates
				);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey) {
						const newDataForField = response.data.data.find(
							(update: Field) => update.field === field.field
						);
						if (newDataForField) return newDataForField;
					}

					return field;
				});

				notify({
					title: i18n.t('fields_update_success'),
					text: updates.map(({ field }) => field).join(', '),
					type: 'success',
				});
			} catch (error) {
				notify({
					title: i18n.t('fields_update_failed'),
					text: updates.map(({ field }) => field).join(', '),
					type: 'error',
				});
				// reset the changes if the api sync failed
				this.state.fields = stateClone;
				throw error;
			}
		},
		async deleteField(collectionKey: string, fieldKey: string) {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;
			const stateClone = [...this.state.fields];

			this.state.fields = this.state.fields.filter((field) => {
				if (field.field === fieldKey && field.collection === collectionKey) return false;
				return true;
			});

			try {
				await api.delete(`/${currentProjectKey}/fields/${collectionKey}/${fieldKey}`);

				notify({
					title: i18n.t('field_delete_success', { field: fieldKey }),
					type: 'success',
				});
			} catch (error) {
				notify({
					title: i18n.t('field_delete_failure', { field: fieldKey }),
					type: 'error',
				});
				this.state.fields = stateClone;
				throw error;
			}
		},
		getPrimaryKeyFieldForCollection(collection: string) {
			/** @NOTE it's safe to assume every collection has a primary key */
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const primaryKeyField = this.state.fields.find(
				(field) => field.collection === collection && field.primary_key === true
			);

			return primaryKeyField;
		},
	},
});
