import { createStore } from 'pinia';
import { FieldRaw, Field } from './types';
import api from '@/api';
import { useProjectsStore } from '@/stores/projects';
import VueI18n from 'vue-i18n';
import { notEmpty } from '@/utils/is-empty/';
import { i18n } from '@/lang';
import formatTitle from '@directus/format-title';
import notify from '@/utils/notify';
import useRelationsStore from '@/stores/relations';
import { Relation } from '@/stores/relations/types';

const fakeFilesField: Field = {
	id: -1,
	collection: 'directus_files',
	field: '$file',
	name: i18n.t('file'),
	datatype: null,
	type: 'file',
	unique: false,
	primary_key: false,
	default_value: null,
	auto_increment: false,
	note: null,
	signed: false,
	sort: 0,
	interface: null,
	options: null,
	display: 'file',
	display_options: null,
	hidden_detail: true,
	hidden_browse: false,
	locked: true,
	required: false,
	translation: null,
	readonly: true,
	width: 'full',
	validation: null,
	group: null,
	length: null,
};

export const useFieldsStore = createStore({
	id: 'fieldsStore',
	state: () => ({
		fields: [] as Field[],
	}),
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const fieldsResponse = await api.get(`/${currentProjectKey}/fields`);

			const fields: FieldRaw[] = fieldsResponse.data.data.filter(
				({ collection }: FieldRaw) => collection !== 'directus_settings'
			);

			/**
			 * @NOTE
			 *
			 * directus_settings is a bit of a special case. It's actual fields (key / value) are not
			 * what we're looking for here. Instead, we want all the "fake" fields that make up the
			 * form. This extra bit of logic is needed to make sure the app doesn't differentiate
			 * between settings and regular collections.
			 */

			const settingsResponse = await api.get(`/${currentProjectKey}/settings/fields`);
			fields.push(...settingsResponse.data.data);

			/**
			 * @NOTE
			 *
			 * directus_fields is another special case. For it to play nice with layouts, we need to
			 * treat the actual image as a separate available field, instead of part of the regular
			 * item (normally all file related info is nested within a separate column). This allows
			 * layouts to render out files as it if were a "normal" collection, where the actual file
			 * is a fake m2o to itself.
			 */

			this.state.fields = [...fields.map(this.addTranslationsForField), fakeFilesField];
		},
		async dehydrate() {
			this.reset();
		},
		addTranslationsForField(field: Field) {
			let name: string | VueI18n.TranslateResult;

			if (notEmpty(field.translation) && field.translation.length > 0) {
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
		},
		async createField(collectionKey: string, newField: Field) {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const stateClone = [...this.state.fields];

			// Update locally first, so the changes are visible immediately
			this.state.fields = [...this.state.fields, newField];

			// Save to API, and update local state again to make sure everything is in sync with the
			// API
			try {
				const response = await api.post(
					`/${currentProjectKey}/fields/${collectionKey}`,
					newField
				);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey && field.field === newField.field) {
						return this.addTranslationsForField(response.data.data);
					}

					return field;
				});

				notify({
					title: i18n.t('field_create_success', { field: newField.field }),
					type: 'success',
				});
			} catch (error) {
				notify({
					title: i18n.t('field_create_failure', { field: newField.field }),
					type: 'error',
				});

				// reset the changes if the api sync failed
				this.state.fields = stateClone;
				throw error;
			}
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
						return this.addTranslationsForField(response.data.data);
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
						if (newDataForField) return this.addTranslationsForField(newDataForField);
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
		getFieldsForCollection(collection: string) {
			return this.state.fields.filter((field) => field.collection === collection);
		},
		getField(collection: string, fieldKey: string) {
			if (fieldKey.includes('.')) {
				return this.getRelationalField(collection, fieldKey);
			} else {
				return this.state.fields.find(
					(field) => field.collection === collection && field.field === fieldKey
				);
			}
		},
		/**
		 * Retrieve field info for a (deeply) nested field
		 * Recursively searches through the relationhips to find the field info that matches the
		 * dot notation.
		 */
		getRelationalField(collection: string, fields: string) {
			const relationshipStore = useRelationsStore();
			const parts = fields.split('.');
			const relationshipForField = relationshipStore
				.getRelationsForField(collection, parts[0])
				?.find((relation: Relation) => relation.field_many === parts[0]);

			if (relationshipForField === undefined) return false;

			const relatedCollection = relationshipForField.collection_one;
			parts.shift();
			const relatedField = parts.join('.');
			return this.getField(relatedCollection, relatedField);
		},
	},
});
