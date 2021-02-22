import { createStore } from 'pinia';
import api from '@/api';
import VueI18n from 'vue-i18n';
import { notEmpty } from '@/utils/is-empty/';
import { i18n } from '@/lang';
import formatTitle from '@directus/format-title';
import { useRelationsStore } from '@/stores/';
import { Relation, FieldRaw, Field } from '@/types';
import { merge } from 'lodash';
import { nanoid } from 'nanoid';
import { unexpectedError } from '@/utils/unexpected-error';

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
		translations: null,
		readonly: true,
		width: 'full',
		group: null,
		note: null,
	},
};

/**
 * @NOTE
 * This keeps track of what update is the last one that's in progress. After every update, the store
 * gets flushed with the updated values, which means that you can have racing conditions if you do
 * multiple updates at the same time. By keeping track which one is the last one that's fired, we
 * can ensure that only the last update gets used to flush the store with.
 */
let currentUpdate: string;

export const useFieldsStore = createStore({
	id: 'fieldsStore',
	state: () => ({
		fields: [] as Field[],
	}),
	actions: {
		async hydrate() {
			const fieldsResponse = await api.get(`/fields`, { params: { limit: -1 } });

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

			if (i18n.te(`fields.${field.collection}.${field.field}`)) {
				name = i18n.t(`fields.${field.collection}.${field.field}`);
			} else if (field.meta && notEmpty(field.meta.translations) && field.meta.translations.length > 0) {
				for (let i = 0; i < field.meta.translations.length; i++) {
					const { language, translation } = field.meta.translations[i];

					i18n.mergeLocaleMessage(language, {
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

				const field = this.parseField(response.data.data);

				this.state.fields = this.state.fields.map((field) => {
					if (field.collection === collectionKey && field.field === newField.field) {
						return field;
					}

					return field;
				});

				return field;
			} catch (err) {
				// reset the changes if the api sync failed
				this.state.fields = stateClone;
				unexpectedError(err);
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
			} catch (err) {
				// reset the changes if the api sync failed
				this.state.fields = stateClone;
				unexpectedError(err);
			}
		},
		async updateFields(collectionKey: string, updates: Partial<Field>[]) {
			const updateID = nanoid();
			const stateClone = [...this.state.fields];

			currentUpdate = updateID;

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

				if (currentUpdate === updateID) {
					this.state.fields = this.state.fields.map((field) => {
						if (field.collection === collectionKey) {
							const newDataForField = response.data.data.find((update: Field) => update.field === field.field);
							if (newDataForField) return this.parseField(newDataForField);
						}

						return field;
					});
				}
			} catch (err) {
				// reset the changes if the api sync failed
				this.state.fields = stateClone;
				unexpectedError(err);
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
			} catch (err) {
				this.state.fields = stateClone;
				unexpectedError(err);
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
			return this.state.fields
				.filter((field) => field.collection === collection)
				.sort((a, b) => {
					if (a.field < b.field) return -1;
					else if (a.field > b.field) return 1;
					else return 1;
				});
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
		 * Recursively searches through the relationships to find the field info that matches the
		 * dot notation.
		 */
		getRelationalField(collection: string, fields: string) {
			const relationshipStore = useRelationsStore();
			const parts = fields.split('.');

			const relationshipForField = relationshipStore
				.getRelationsForField(collection, parts[0])
				?.find((relation: Relation) => relation.many_field === parts[0] || relation.one_field === parts[0]);

			if (relationshipForField === undefined) return false;

			const relatedCollection = relationshipForField.one_collection;
			parts.shift();
			const relatedField = parts.join('.');
			return this.getField(relatedCollection, relatedField);
		},
	},
});
