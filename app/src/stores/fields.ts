import api from '@/api';
import { i18n } from '@/lang';
import { useCollectionsStore } from '@/stores/collections';
import { useRelationsStore } from '@/stores/relations';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { translate as translateLiteral } from '@/utils/translate-literal';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import formatTitle from '@directus/format-title';
import { DeepPartial, Field, FieldRaw, Relation } from '@directus/shared/types';
import { isEqual, isNil, merge, omit, orderBy } from 'lodash';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

type HydrateOptions = {
	/**
	 * Allow disabling field translation on hydrate. Used in global app hydration to account for
	 * user's custom locale instead of the default en-US locale.
	 */
	skipTranslation?: boolean;
};

/**
 * directus_files is a special case. For it to play nice with interfaces/layouts/displays, we need
 * to treat the actual image thumbnail as a separate available field, instead of part of the regular
 * item (normally all file related info is nested within a separate column). This allows layouts to
 * render out files as it if were a "normal" collection, where the actual file is a fake m2o to
 * itself.
 */
const fakeFilesField: Field = {
	collection: 'directus_files',
	field: '$thumbnail',
	schema: null,
	name: '$thumbnail',
	type: 'integer',
	meta: {
		id: -1,
		collection: 'directus_files',
		field: '$thumbnail',
		sort: null,
		special: null,
		interface: null,
		options: null,
		display: 'file',
		display_options: null,
		hidden: false,
		translations: null,
		readonly: true,
		width: 'full',
		group: null,
		note: null,
		required: false,
		conditions: null,
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

export const useFieldsStore = defineStore({
	id: 'fieldsStore',
	state: () => ({
		fields: [] as Field[],
	}),
	actions: {
		async hydrate(options?: HydrateOptions) {
			const fieldsResponse = await api.get<any>(`/fields`, { params: { limit: -1 } });

			const fields: FieldRaw[] = fieldsResponse.data.data;
			this.fields = [...fields.map(this.parseField), fakeFilesField];
			if (options?.skipTranslation !== true) this.translateFields();
		},
		async dehydrate() {
			this.$reset();
		},
		parseField(field: FieldRaw): Field {
			let name = formatTitle(field.field);

			const localesToKeep =
				field.meta && !isNil(field.meta.translations) && Array.isArray(field.meta.translations)
					? field.meta.translations.map((translation) => translation.language)
					: [];

			for (const locale of i18n.global.availableLocales) {
				if (
					i18n.global.te(`fields.${field.collection}.${field.field}`, locale) &&
					!localesToKeep.includes(locale) &&
					!field.meta?.system
				) {
					i18n.global.mergeLocaleMessage(locale, { fields: { [field.collection]: { [field.field]: undefined } } });
				}
			}

			if (field.meta && !isNil(field.meta.translations) && Array.isArray(field.meta.translations)) {
				for (let i = 0; i < field.meta.translations.length; i++) {
					const { language, translation } = field.meta.translations[i];

					i18n.global.mergeLocaleMessage(language, {
						...(translation
							? {
									fields: {
										[field.collection]: {
											[field.field]: getLiteralInterpolatedTranslation(translation),
										},
									},
							  }
							: {}),
					});
				}
			}

			if (i18n.global.te(`fields.${field.collection}.${field.field}`)) {
				name = i18n.global.t(`fields.${field.collection}.${field.field}`);
			}

			return {
				...field,
				name,
			};
		},
		translateFields() {
			this.fields = this.fields.map((field) => {
				if (i18n.global.te(`fields.${field.collection}.${field.field}`)) {
					field.name = i18n.global.t(`fields.${field.collection}.${field.field}`);
				}
				if (field.meta?.note) field.meta.note = translateLiteral(field.meta.note);
				if (field.meta?.options) field.meta.options = translate(field.meta.options);
				if (field.meta?.display_options) field.meta.display_options = translate(field.meta.display_options);
				if (field.meta?.validation_message)
					field.meta.validation_message = translateLiteral(field.meta.validation_message);

				return field;
			});
		},
		async upsertField(collection: string, field: string, values: DeepPartial<Field>) {
			const existing = this.getField(collection, field);

			// Strip out auto-generated fields the app might've added
			const rawField = omit(values, ['name']);

			if (existing) {
				if (isEqual(values, existing)) return;

				return await this.updateField(collection, field, rawField);
			} else {
				return await this.createField(collection, rawField);
			}
		},
		async createField(collectionKey: string, newField: DeepPartial<Field>) {
			const stateClone = [...this.fields];

			// Save to API, and update local state again to make sure everything is in sync with the
			// API
			try {
				const response = await api.post<{ data: Field }>(`/fields/${collectionKey}`, newField);

				const createdField = this.parseField(response.data.data);

				this.fields = [...this.fields, createdField];

				return createdField;
			} catch (err: any) {
				// reset the changes if the api sync failed
				this.fields = stateClone;
				unexpectedError(err);
			}
		},
		async updateField(collectionKey: string, fieldKey: string, updates: DeepPartial<Field>) {
			const stateClone = [...this.fields];

			// Update locally first, so the changes are visible immediately
			this.fields = this.fields.map((field) => {
				if (field.collection === collectionKey && field.field === fieldKey) {
					return merge({}, field, updates);
				}

				return field;
			});

			// Save to API, and update local state again to make sure everything is in sync with the
			// API
			try {
				const response = await api.patch<any>(`/fields/${collectionKey}/${fieldKey}`, updates);

				this.fields = this.fields.map((field) => {
					if (field.collection === collectionKey && field.field === fieldKey) {
						return this.parseField(response.data.data);
					}

					return field;
				});
			} catch (err: any) {
				// reset the changes if the api sync failed
				this.fields = stateClone;
				unexpectedError(err);
			}
		},
		async updateFields(collectionKey: string, updates: DeepPartial<Field>[]) {
			const updateID = nanoid();
			const stateClone = [...this.fields];

			currentUpdate = updateID;

			// Update locally first, so the changes are visible immediately
			this.fields = this.fields.map((field) => {
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
					this.fields = this.fields.map((field) => {
						if (field.collection === collectionKey) {
							const newDataForField = response.data.data.find((update: Field) => update.field === field.field);
							if (newDataForField) return this.parseField(newDataForField);
						}

						return field;
					});

					this.translateFields();
				}
			} catch (err: any) {
				// reset the changes if the api sync failed
				this.fields = stateClone;
				unexpectedError(err);
			}
		},
		async deleteField(collectionKey: string, fieldKey: string) {
			const relationsStore = useRelationsStore();
			const collectionsStore = useCollectionsStore();

			const stateClone = [...this.fields];
			const relationsStateClone = [...relationsStore.relations];

			this.fields = this.fields.filter((field) => {
				if (field.field === fieldKey && field.collection === collectionKey) return false;
				return true;
			});

			relationsStore.relations = relationsStore.relations.filter((relation) => {
				if (
					(relation.collection === collectionKey && relation.field === fieldKey) ||
					(relation.related_collection === collectionKey && relation.meta?.one_field === fieldKey)
				) {
					return false;
				}
				return true;
			});

			try {
				await api.delete(`/fields/${collectionKey}/${fieldKey}`);
				await collectionsStore.hydrate();
			} catch (err: any) {
				this.fields = stateClone;
				relationsStore.relations = relationsStateClone;
				unexpectedError(err);
			}
		},
		getPrimaryKeyFieldForCollection(collection: string): Field | null {
			const primaryKeyField = this.fields.find(
				(field) => field.collection === collection && field.schema?.is_primary_key === true
			);

			return primaryKeyField ?? null;
		},
		getFieldsForCollection(collection: string): Field[] {
			return orderBy(
				this.fields.filter((field) => field.collection === collection),
				[(field) => field.meta?.system === true, (field) => (field.meta?.sort ? Number(field.meta?.sort) : null)],
				['desc', 'asc']
			);
		},
		getFieldsForCollectionAlphabetical(collection: string): Field[] {
			return this.getFieldsForCollection(collection).sort((a: Field, b: Field) => {
				if (a.field < b.field) return -1;
				else if (a.field > b.field) return 1;
				else return 1;
			});
		},
		/**
		 * Retrieve sorted fields including groups. This is necessary because
		 * fields inside groups starts their sort number from 1 to N again.
		 */
		getFieldsForCollectionSorted(collection: string): Field[] {
			const fields = orderBy(
				this.fields.filter((field) => field.collection === collection),
				'meta.sort'
			);

			const nonGroupFields = fields.filter((field: Field) => !field.meta?.group);

			for (const [index, field] of nonGroupFields.entries()) {
				const groupFields = fields.filter((groupField: Field) => groupField.meta?.group === field.field);

				if (groupFields.length) {
					nonGroupFields.splice(index + 1, 0, ...orderBy(groupFields, 'meta.sort'));
				}
			}

			return nonGroupFields;
		},
		/**
		 * Retrieve field info for a field or a related field
		 */
		getField(collection: string, fieldKey: string): Field | null {
			if (fieldKey.includes('.')) {
				return this.getRelationalField(collection, fieldKey) || null;
			} else {
				return this.fields.find((field) => field.collection === collection && field.field === fieldKey) || null;
			}
		},
		/**
		 * Retrieve nested fields for a given group field
		 */
		getFieldGroupChildren(collection: string, fieldKey: string): Field[] | null {
			return this.fields.filter((field) => field.collection === collection && field.meta?.group === fieldKey) || null;
		},
		/**
		 * Retrieve field info for a (deeply) nested field
		 * Recursively searches through the relationships to find the field info that matches the
		 * dot notation.
		 */
		getRelationalField(collection: string, fields: string) {
			const relationsStore = useRelationsStore();
			const [field, ...path] = fields.split('.');
			if (field.includes(':')) {
				const [_, collection] = field.split(':');
				return this.getField(collection, path.join('.'));
			}

			const relations = relationsStore.getRelationsForField(collection, field);
			const relation = relations?.find((relation: Relation) => {
				return relation.field === field || relation.meta?.one_field === field;
			});

			if (relation === undefined) return false;

			const relatedCollection = relation.field === field ? relation.related_collection : relation.collection;

			if (relatedCollection === null) return false;

			const relatedField = path.join('.');
			return this.getField(relatedCollection, relatedField);
		},
	},
});
