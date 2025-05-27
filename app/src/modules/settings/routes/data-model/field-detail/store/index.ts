import api from '@/api';
import { useExtensions } from '@/extensions';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { unexpectedError } from '@/utils/unexpected-error';
import type { DisplayConfig, InterfaceConfig } from '@directus/extensions';
import type { Collection, DeepPartial, Field, LocalType, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { cloneDeep, get, has, isEmpty, mergeWith, orderBy, set, sortBy } from 'lodash';
import { defineStore } from 'pinia';
import { computed } from 'vue';
import * as alterations from './alterations';

export function syncFieldDetailStoreProperty(path: string, defaultValue?: any) {
	const fieldDetailStore = useFieldDetailStore();

	return computed({
		get() {
			return get(fieldDetailStore, path, defaultValue);
		},
		set(val: any) {
			fieldDetailStore.update(set({}, path, val));
		},
	});
}

export const useFieldDetailStore = defineStore({
	id: 'fieldDetailStore',
	state: () => ({
		/** Whether there are additional field metadata being fetched (used in startEditing) */
		loading: false,

		/** The current collection we're operating in */
		collection: undefined as string | undefined,

		/** What field we're currently editing ("+"" for new)  */
		editing: '+' as string,

		/** Full field data with edits */
		field: {
			field: undefined,
			type: undefined,
			schema: {},
			meta: {},
		} as DeepPartial<Field>,

		/** Contains only edited properties of the field */
		fieldUpdates: {} as DeepPartial<Field>,

		/** Relations that will be upserted as part of this change */
		relations: {
			m2o: undefined as DeepPartial<Relation> | undefined,
			o2m: undefined as DeepPartial<Relation> | undefined,
		},

		/** Collections that will be upserted as part of this change */
		collections: {
			junction: undefined as DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined,
			related: undefined as DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined,
		},

		/** Fields that will be upserted as part of this change */
		fields: {
			corresponding: undefined as DeepPartial<Field> | undefined,
			junctionCurrent: undefined as DeepPartial<Field> | undefined,
			junctionRelated: undefined as DeepPartial<Field> | undefined,
			sort: undefined as DeepPartial<Field> | undefined,
			oneCollectionField: undefined as DeepPartial<Field> | undefined,
		},

		/** Any items that need to be injected into any collection */
		items: {} as Record<string, Record<string, any>[]>,

		/** The local type used for the current field */
		localType: 'standard' as LocalType,

		/** Whether to auto-fill the field names of the junction relation */
		autoGenerateJunctionRelation: true,

		/** Whether the field settings are currently being saved */
		saving: false,
	}),
	actions: {
		async startEditing(collection: string, field: string, localType?: LocalType) {
			// Make sure we clean up any stray values from unexpected paths
			this.$reset();

			this.collection = collection;
			this.field.collection = collection;
			this.editing = field;

			if (field !== '+') {
				const fieldsStore = useFieldsStore();
				const relationsStore = useRelationsStore();

				this.field = cloneDeep(fieldsStore.getField(collection, field)!);
				this.localType = getLocalTypeForField(collection, field)!;

				const relations = cloneDeep(relationsStore.getRelationsForField(collection, field));

				// O2M relation is the same regardless of type
				this.relations.o2m = relations.find(
					(relation) => relation.related_collection === collection && relation.meta?.one_field === field,
				) as DeepPartial<Relation> | undefined;

				if (['files', 'm2m', 'translations', 'm2a'].includes(this.localType)) {
					// These types rely on directus_relations fields being said, so meta should exist for these particular relations
					this.relations.m2o = relations.find((relation) => relation.meta?.id !== this.relations.o2m?.meta?.id) as
						| DeepPartial<Relation>
						| undefined;
				} else {
					this.relations.m2o = relations.find(
						(relation) => relation.collection === collection && relation.field === field,
					) as DeepPartial<Relation> | undefined;
				}

				// Re-fetch field meta to get the raw untranslated values
				try {
					this.loading = true;
					const response = await api.get(`/fields/${collection}/${field}`);
					const fetchedFieldMeta = response.data?.data?.meta;

					this.$patch({
						field: {
							meta: {
								...(fetchedFieldMeta?.note ? { note: fetchedFieldMeta.note } : {}),
								...(fetchedFieldMeta?.options ? { options: fetchedFieldMeta.options } : {}),
								...(fetchedFieldMeta?.display_options ? { display_options: fetchedFieldMeta.display_options } : {}),
								...(fetchedFieldMeta?.validation_message
									? { validation_message: fetchedFieldMeta.validation_message }
									: {}),
							},
						},
					});
				} finally {
					this.loading = false;
				}
			} else {
				this.update({
					localType: localType ?? 'standard',
				});
			}
		},
		update(updates: DeepPartial<typeof this.$state>) {
			const hasChanged = (path: string) => has(updates, path) && get(updates, path) !== get(this, path);
			const getCurrent = (path: string) => (has(updates, path) ? get(updates, path) : get(this, path));

			this.$patch((state) => {
				if (hasChanged('field.meta.interface')) {
					alterations.global.setLocalTypeForInterface(updates);
					alterations.global.setTypeForInterface(updates, state);
				}

				if (hasChanged('localType')) {
					alterations.global.resetSchema(updates, state);
					alterations.global.resetRelations(updates);
					alterations.global.setSpecialForLocalType(updates);
				}

				const localType = getCurrent('localType') as LocalType | undefined;

				if (localType) {
					alterations[localType].applyChanges(updates, state, { hasChanged, getCurrent });
				}

				if (hasChanged('relations.m2o.related_collection')) {
					const currentType = getCurrent('localType');
					let targetType = currentType;

					if (get(updates, 'relations.m2o.related_collection') === 'directus_files') {
						if (currentType === 'm2o') targetType = 'file';
						if (currentType === 'm2m') targetType = 'files';
					} else {
						if (currentType === 'file') targetType = 'm2o';
						if (currentType === 'files') targetType = 'm2m';
					}

					if (currentType !== targetType) {
						updates.localType = targetType;
						alterations.global.switchInterfaceAndDisplay(updates);
					}
				}

				const { field: fieldUpdates, items: itemUpdates, ...restUpdates } = updates;

				// Handle `field` updates, shallow merge and mirror to `fieldUpdates`
				if (fieldUpdates) {
					const { schema: schemaUpdates, meta: metaUpdates, ...restFieldUpdates } = fieldUpdates;

					Object.assign(state.field, restFieldUpdates);
					Object.assign(state.fieldUpdates, restFieldUpdates);

					if (schemaUpdates) {
						Object.assign((state.field.schema ??= {}), schemaUpdates);
						Object.assign((state.fieldUpdates.schema ??= {}), schemaUpdates);
					}

					if (metaUpdates) {
						Object.assign((state.field.meta ??= {}), metaUpdates);
						Object.assign((state.fieldUpdates.meta ??= {}), metaUpdates);
					}
				}

				// Handle `item` updates, allowing full replacements
				if (itemUpdates) {
					state.items = itemUpdates as (typeof this.$state)['items'];
				}

				// Handle remaining updates, deep merge
				mergeWith(state, restUpdates, (_, srcValue, key, object) => {
					// Override arrays instead of merging
					if (Array.isArray(srcValue)) return srcValue;
					// Allow properties to be resettable
					if (srcValue === undefined) object[key] = undefined;
					return;
				});
			});
		},
		async save() {
			if (!this.collection || !this.field.field) return;

			// Validation to prevent cyclic relation
			const aliasesFromRelation: string[] = [];

			for (const relation of Object.values(this.relations)) {
				if (!relation || !relation.collection || !relation.field) continue;

				if (
					// Duplicate checks for O2M & M2O
					(relation.collection === relation.related_collection && relation.field === relation.meta?.one_field) ||
					// Duplicate checks for M2M & M2A
					(relation.meta?.one_field &&
						(aliasesFromRelation.includes(`${relation.collection}:${relation.field}`) ||
							aliasesFromRelation.includes(`${this.collection}:${relation.meta.one_field}`)))
				) {
					throw new Error('Field key cannot be the same as foreign key');
				}

				// Track fields used for M2M & M2A
				if (this.collection === relation.related_collection && relation.meta?.one_field) {
					aliasesFromRelation.push(`${relation.collection}:${relation.field}`);
					aliasesFromRelation.push(`${this.collection}:${relation.meta.one_field}`);
				}
			}

			// Duplicate field check for M2A
			const addedFields = Object.values(this.fields)
				.map((field) => (field && field.collection && field.field ? `${field.collection}:${field.field}` : null))
				.filter((field) => field);

			if (addedFields.some((field) => addedFields.indexOf(field) !== addedFields.lastIndexOf(field))) {
				throw new Error('Duplicate fields cannot be created');
			}

			const collectionsStore = useCollectionsStore();
			const fieldsStore = useFieldsStore();
			const relationsStore = useRelationsStore();

			this.saving = true;

			try {
				if (Object.keys(this.fieldUpdates).length > 0) {
					await fieldsStore.upsertField(this.collection, this.editing, this.fieldUpdates);
				}

				for (const collection of Object.values(this.collections)) {
					if (!collection || !collection.collection) continue;
					await collectionsStore.upsertCollection(collection?.collection, collection);
				}

				for (const field of Object.values(this.fields)) {
					if (!field || !field.collection || !field.field) continue;
					await fieldsStore.upsertField(field.collection, field.field, field);
				}

				for (const relation of Object.values(this.relations)) {
					if (!relation || !relation.collection || !relation.field) continue;
					await relationsStore.upsertRelation(relation.collection, relation.field, relation);
				}

				for (const collection of Object.keys(this.items)) {
					await api.post(getEndpoint(collection), this.items[collection]);
				}

				await fieldsStore.hydrate({ skipTranslation: true });
			} catch (error) {
				unexpectedError(error);
			} finally {
				this.saving = false;
			}
		},
	},
	getters: {
		missingConfiguration(state) {
			const requiredProperties = ['field.field', 'field.type', 'collection'];

			const localType = state.localType;

			if (localType === 'files' || localType === 'm2m' || localType === 'translations') {
				requiredProperties.push(
					'relations.o2m.collection',
					'relations.o2m.field',
					'relations.o2m.related_collection',
					'relations.m2o.collection',
					'relations.m2o.field',
					'relations.m2o.related_collection',
				);
			}

			if (localType === 'file' || localType === 'm2o') {
				requiredProperties.push('relations.m2o.collection', 'relations.m2o.field', 'relations.m2o.related_collection');
			}

			if (localType === 'o2m') {
				requiredProperties.push('relations.o2m.collection', 'relations.o2m.field', 'relations.o2m.related_collection');
			}

			if (localType === 'm2a') {
				requiredProperties.push(
					'relations.o2m.collection',
					'relations.o2m.field',
					'relations.o2m.related_collection',
					'relations.m2o.collection',
					'relations.m2o.field',
					'relations.m2o.meta.one_allowed_collections',
					'relations.m2o.meta.one_collection_field',
				);
			}

			return requiredProperties.filter((path) => {
				return (has(state, path) && isEmpty(get(state, path)) === false) === false;
			});
		},
		readyToSave() {
			return this.missingConfiguration.length === 0;
		},
		interfacesForType(): InterfaceConfig[] {
			const { interfaces } = useExtensions();

			return orderBy(
				interfaces.value.filter((inter: InterfaceConfig) => {
					// Filter out all system interfaces
					if (inter.system === true) return false;

					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.localType);

					return matchesType && matchesLocalType;
				}),
				['name'],
			);
		},
		displaysForType(): DisplayConfig[] {
			const { displays } = useExtensions();

			return orderBy(
				displays.value.filter((inter: DisplayConfig) => {
					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.localType);

					return matchesType && matchesLocalType;
				}),
				['name'],
			);
		},
		generationInfo() {
			const items: { name: string; type: 'collection' | 'field' }[] = [];

			for (const collection of Object.values(this.collections)) {
				if (!collection || !collection.collection) continue;

				items.push({
					name: collection.collection,
					type: 'collection',
				});
			}

			for (const field of Object.values(this.fields)) {
				if (!field || !field.collection || !field.field) continue;

				items.push({
					name: `${field.collection}.${field.field}`,
					type: 'field',
				});
			}

			return sortBy(items, 'name');
		},
	},
});
