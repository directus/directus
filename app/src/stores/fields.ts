import { createStore } from 'pinia';
import api from '@/api';
import VueI18n from 'vue-i18n';
import { notEmpty } from '@/utils/is-empty/';
import { i18n } from '@/lang';
import formatTitle from '@directus/format-title';
import notify from '@/utils/notify';
import { useRelationsStore } from '@/stores/';
import { Relation, FieldRaw, Field } from '@/types';
import { merge } from 'lodash';

const fakeFilesField: Field = {
	collection: 'directus_files',
	field: '$file',
	schema: null,
	name: i18n.t('file'),
	type: 'integer',
	meta: {
		id: -1,
		collection: 'directus_files',
		field: '$file',
		sort: null,
		special: null,
		interface: null,
		options: null,
		display: 'file',
		display_options: null,
		hidden: false,
		locked: true,
		required: false,
		translation: null,
		readonly: true,
		width: 'full',
		group: null,
		note: null,
	},
};

function getMetaDefault(collection: string, field: string): Field['meta'] {
	return {
		id: -1,
		collection,
		field,
		group: null,
		hidden: false,
		interface: null,
		display: null,
		display_options: null,
		locked: false,
		options: null,
		readonly: false,
		required: false,
		sort: null,
		special: null,
		translation: null,
		width: 'full',
		note: null,
	};
}

export const useFieldsStore = createStore({
	id: 'fieldsStore',
	state: () => ({
		fields: [] as Field[],
	}),
	actions: {
		async hydrate() {
			const fieldsResponse = await api.get(`/fields`);

			const fields: FieldRaw[] = fieldsResponse.data.data;

			/**
			 * @NOTE
			 *
			 * directus_files is a special case. For it to play nice with layouts, we need to
			 * treat the actual image as a separate available field, instead of part of the regular
			 * item (normally all file related info is nested within a separate column). This allows
			 * layouts to render out files as it if were a "normal" collection, where the actual file
			 * is a fake m2o to itself.
			 */

			this.state.fields = [...fields.map(this.parseField), fakeFilesField];
		},
		async dehydrate() {
			this.reset();
		},
		parseField(field: FieldRaw): Field {
			let name: string | VueI18n.TranslateResult;

			const meta = field.meta === null ? getMetaDefault(field.collection, field.field) : field.meta;

			if (i18n.te(`fields.${field.collection}.${field.field}`)) {
				name = i18n.t(`fields.${field.collection}.${field.field}`);
			} else if (notEmpty(meta.translation) && meta.translation.length > 0) {
				for (let i = 0; i < meta.translation.length; i++) {
					const { locale, translation } = meta.translation[i];

					i18n.mergeLocaleMessage(locale, {
						fields: {
							[field.collection]: {
								[field.field]: translation,
							},
						},
					});
				}

				name = i18n.t(`fields.${field.collection}.${field.field}`);
			} else {
				name = formatTitle(field.field);
			}

			return {
				...field,
				name,
				meta,
			};
		},
		async createField(collectionKey: string, newField: Field) {
			const stateClone = [...this.state.fields];

			// Update locally first, so the changes are visible immediately
			this.state.fields = [...this.state.fields, newField];

			// Save to API, and update local state again to make sure everything is in sync with the
			// API
			try {
				const response = await api.post(`/fields/${collectionKey}`, newField);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey && field.field === newField.field) {
						return this.parseField(response.data.data);
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
		async updateField(collectionKey: string, fieldKey: string, updates: Record<string, Partial<Field>>) {
			const stateClone = [...this.state.fields];

			// Update locally first, so the changes are visible immediately
			this.state.fields = this.state.fields.map((field) => {
				if (field.collection === collectionKey && field.field === fieldKey) {
					return merge({}, field, updates);
				}

				return field;
			});

			// Save to API, and update local state again to make sure everything is in sync with the
			// API
			try {
				const response = await api.patch(`/fields/${collectionKey}/${fieldKey}`, updates);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey && field.field === fieldKey) {
						return this.parseField(response.data.data);
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
			const stateClone = [...this.state.fields];

			// Update locally first, so the changes are visible immediately
			this.state.fields = this.state.fields.map((field) => {
				if (field.collection === collectionKey) {
					const updatesForThisField = updates.find((update) => update.field === field.field);

					if (updatesForThisField) {
						return merge({}, field, updatesForThisField);
					}
				}

				return field;
			});

			try {
				// Save to API, and update local state again to make sure everything is in sync with the
				// API
				const response = await api.patch(`/fields/${collectionKey}`, updates);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey) {
						const newDataForField = response.data.data.find(
							(update: Field) => update.field === field.field
						);
						if (newDataForField) return this.parseField(newDataForField);
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
			const stateClone = [...this.state.fields];

			this.state.fields = this.state.fields.filter((field) => {
				if (field.field === fieldKey && field.collection === collectionKey) return false;
				return true;
			});

			try {
				await api.delete(`/fields/${collectionKey}/${fieldKey}`);

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
				(field) => field.collection === collection && field.schema?.is_primary_key === true
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
				return this.state.fields.find((field) => field.collection === collection && field.field === fieldKey);
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
				?.find((relation: Relation) => relation.many_field === parts[0]);

			if (relationshipForField === undefined) return false;

			const relatedCollection = relationshipForField.one_collection;
			parts.shift();
			const relatedField = parts.join('.');
			return this.getField(relatedCollection, relatedField);
		},
	},
});
