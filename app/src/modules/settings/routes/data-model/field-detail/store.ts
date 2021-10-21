import { defineStore, SubscriptionCallback } from 'pinia';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { has, isEmpty, isNil, orderBy } from 'lodash';
import { InterfaceConfig, DisplayConfig, DeepPartial, Field, Relation, Collection } from '@directus/shared/types';
import { LOCAL_TYPES } from '@directus/shared/constants';
import { computed } from 'vue';
import { get, set } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores';
import api from '@/api';

const global: Record<string, (updates: StateUpdates, state: State) => void> = {
	setLocalTypeForInterface(updates) {
		if (!updates.field?.meta?.interface) return;

		const chosenInterface = getInterfaces().interfaces.value.find(
			(inter) => inter.id === updates.field!.meta!.interface
		);

		if (!chosenInterface) return;

		const localType = chosenInterface?.localTypes?.[0] ?? 'standard';
		set(updates, 'localType', localType);
	},
	setTypeForInterface(updates, state: State) {
		if (!updates.field?.meta?.interface) return;

		const chosenInterface = getInterfaces().interfaces.value.find(
			(inter) => inter.id === updates.field!.meta!.interface
		);

		if (!chosenInterface) return updates;

		if (state.field.type && chosenInterface.types.includes(state.field.type)) return;

		const defaultType = chosenInterface?.types[0];
		set(updates, 'field.type', defaultType);
	},
	setSpecialForType(updates) {
		const type = updates.field?.type;

		if (!type) return;

		switch (type) {
			case 'uuid':
				set(updates, 'field.meta.special', ['uuid']);
				break;
			case 'hash':
				set(updates, 'field.meta.special', ['hash']);
				break;
			case 'json':
				set(updates, 'field.meta.special', ['json']);
				break;
			case 'csv':
				set(updates, 'field.meta.special', ['csv']);
				break;
			case 'boolean':
				set(updates, 'field.meta.special', ['boolean']);
				break;
			case 'geometry':
				set(updates, 'field.meta.special', ['geometry']);
				break;
			default:
				set(updates, 'field.meta.special', null);
		}
	},
	setSpecialForLocalType(updates) {
		if (updates?.localType === 'o2m') {
			set(updates, 'field.meta.special', ['o2m']);
		}

		if (updates?.localType === 'm2m') {
			set(updates, 'field.meta.special', ['m2m']);
		}

		if (updates?.localType === 'm2a') {
			set(updates, 'field.meta.special', ['m2a']);
		}

		if (updates?.localType === 'm2o') {
			set(updates, 'field.meta.special', ['m2o']);
		}

		if (updates?.localType === 'translations') {
			set(updates, 'field.meta.special', ['translations']);
		}

		if (updates?.localType === 'presentation') {
			set(updates, 'field.meta.special', ['alias', 'no-data']);
		}

		if (updates?.localType === 'group') {
			set(updates, 'field.meta.special', ['alias', 'no-data', 'group']);
		}
	},
	resetRelations(updates) {
		if (!updates.relations) updates.relations = {};
		updates.relations.m2a = undefined;
		updates.relations.m2o = undefined;
		updates.relations.o2m = undefined;
	},
};

const m2o: Record<string, (updates: StateUpdates, state: State) => void> = {
	prepareRelation(updates, state) {
		// Add if existing
		if (!updates.relations) updates.relations = {};

		updates.relations.m2o = {
			collection: state.collection,
			field: state.field.field,
			related_collection: undefined,
			meta: {
				sort_field: null,
			},
			schema: {
				on_delete: 'SET NULL',
			},
		};
	},
	updateRelationField(updates) {
		if (!updates.field?.field) return;

		if (!updates.relations?.m2o) updates.relations = { m2o: {} };
		set(updates, 'relations.m2o.field', updates.field.field);
	},
	generateRelatedCollection(updates) {
		const relatedCollection = updates.relations?.m2o?.related_collection;
		if (!relatedCollection) return;
		if (!updates.collections?.related) updates.collections = { related: undefined };

		const collectionsStore = useCollectionsStore();

		const exists = !!collectionsStore.getCollection(relatedCollection);

		if (exists === false) {
			updates.collections.related = {
				collection: relatedCollection,
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: {
							has_auto_increment: true,
							is_primary_key: true,
						},
						meta: {
							hidden: true,
						},
					},
				],
				meta: {},
				schema: {},
			};
		}
	},
	preventCircularConstraint(updates, state) {
		const relatedCollection = updates.relations?.m2o?.related_collection;
		if (!relatedCollection) return;
		if (!updates.relations) updates.relations = {};

		if (relatedCollection === state.collection) {
			set(updates, 'relations.m2o.schema.on_delete', 'NO ACTION');
		}
	},
	setTypeToRelatedPrimaryKey(updates, state) {
		const relatedCollection = updates.relations?.m2o?.related_collection;
		if (!relatedCollection) return;

		const fieldsStore = useFieldsStore();

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

		if (primaryKeyField) {
			set(updates, 'field.type', primaryKeyField.type);
		} else if (state.collections.related?.fields?.[0]?.type) {
			set(updates, 'field.type', state.collections.related.fields[0].type);
		}
	},
};

const o2m: Record<string, (updates: StateUpdates, state: State) => void> = {
	removeSchema(updates) {
		set(updates, 'field.schema', undefined);
	},
	setTypeToAlias(updates) {
		set(updates, 'field.type', 'alias');
	},
	prepareRelation(updates, state) {
		if (!updates.relations) updates.relations = {};

		updates.relations.o2m = {
			collection: undefined,
			field: undefined,
			related_collection: state.collection,
			meta: {
				one_field: updates.field?.field ?? state.field.field,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
			schema: {
				on_delete: 'SET NULL',
			},
		};
	},
	preventCircularConstraint(updates, state) {
		const collection = updates.relations?.o2m?.collection;
		if (!collection) return;
		if (!updates.relations) updates.relations = {};

		if (collection === state.collection) {
			set(updates, 'relations.o2m.schema.on_delete', 'NO ACTION');
		}
	},
	updateRelationField(updates) {
		if (!updates.field?.field) return;

		if (!updates.relations?.o2m) updates.relations = { o2m: {} };
		set(updates, 'relations.o2m.meta.one_field', updates.field.field);
	},
	useExistingRelationValues(updates) {
		if (!updates.relations) updates.relations = {};
		const relationsStore = useRelationsStore();

		const collection = updates.relations.o2m?.collection;
		const field = updates.relations.o2m?.field;

		if (collection && field) {
			const existingRelation = relationsStore.getRelationForField(collection, field);

			if (existingRelation) {
				set(updates, 'relations.o2m.schema.on_delete', existingRelation.schema?.on_delete);
				return;
			}
		}
	},
	generateRelatedCollection(updates) {
		const collection = updates.relations?.o2m?.collection;
		if (!collection) return;

		const collectionsStore = useCollectionsStore();

		const exists = !!collectionsStore.getCollection(collection);

		if (!updates.collections?.related) updates.collections = { related: undefined };

		if (exists === false) {
			updates.collections.related = {
				collection: collection,
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: {
							has_auto_increment: true,
							is_primary_key: true,
						},
						meta: {
							hidden: true,
						},
					},
				],
				meta: {},
				schema: {},
			};
		}
	},
	generateRelatedField(updates, state) {
		const fieldsStore = useFieldsStore();
		const collection = updates.relations?.o2m?.collection ?? state.relations.o2m?.collection;
		if (!collection) return;

		const currentCollectionPrimaryKeyFieldType = state.collection
			? fieldsStore.getPrimaryKeyFieldForCollection(state.collection)?.type ?? 'integer'
			: 'integer';

		const field = updates.relations?.o2m?.field;

		if (!field) return;

		const exists = !!fieldsStore.getField(collection, field);

		if (!updates.fields?.corresponding) updates.fields = { corresponding: undefined };

		if (exists === false) {
			updates.fields.corresponding = {
				collection: collection,
				field: field,
				type: currentCollectionPrimaryKeyFieldType,
				schema: {},
			};
		}
	},
	updateGeneratedRelatedField(updates, state) {
		const collection = updates.relations?.o2m?.collection;
		if (!collection) return;

		if (state.fields.corresponding) {
			set(updates, 'fields.corresponding.collection', collection);
		}
	},
};

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
	id: 'field-detail',
	state: () => ({
		// The current collection we're operating in
		collection: undefined as string | undefined,

		// Current field to be created / edited
		field: {
			field: undefined,
			type: undefined,
			schema: undefined,
			meta: undefined,
		} as DeepPartial<Field>,

		// Relations that will be upserted as part of this change
		relations: {
			m2o: undefined as DeepPartial<Relation> | undefined,
			o2m: undefined as DeepPartial<Relation> | undefined,
			m2a: undefined as DeepPartial<Relation> | undefined,
		},

		// Collections that will be upserted as part of this change
		collections: {
			junction: undefined as DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined,
			related: undefined as DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined,
		},

		// Fields that will be upserted as part of this change
		fields: {
			corresponding: undefined as DeepPartial<Field> | undefined,
		},

		// Any items that need to be injected into any collection
		items: {} as Record<string, Record<string, any>[]>,

		// Various flags that alter the operations of watchers and getters
		localType: 'standard' as typeof LOCAL_TYPES[number],
		autoGenerateJunctionRelation: true,
		saving: false,
	}),
	actions: {
		update(updates: DeepPartial<typeof this.$state>) {
			const hasChanged = (path: string) => has(updates, path) && get(updates, path) !== get(this, path);
			const getCurrent = (path: string) => (has(updates, path) ? get(updates, path) : get(this, path));

			if (hasChanged('field.meta.interface')) {
				global.setLocalTypeForInterface(updates, this);
				global.setTypeForInterface(updates, this);
			}

			if (hasChanged('field.type')) {
				global.setSpecialForType(updates, this);
			}

			if (hasChanged('localType')) {
				global.resetRelations(updates, this);
				global.setSpecialForLocalType(updates, this);

				if (getCurrent('localType') === 'm2o') {
					m2o.prepareRelation(updates, this);
				}

				if (getCurrent('localType') === 'o2m') {
					o2m.removeSchema(updates, this);
					o2m.setTypeToAlias(updates, this);
					o2m.prepareRelation(updates, this);
				}
			}

			if (hasChanged('field.field')) {
				if (getCurrent('localType') === 'm2o') {
					m2o.updateRelationField(updates, this);
				}

				if (getCurrent('localType') === 'o2m') {
					o2m.updateRelationField(updates, this);
				}
			}

			if (hasChanged('relations.m2o.related_collection')) {
				m2o.generateRelatedCollection(updates, this);
				m2o.preventCircularConstraint(updates, this);
				m2o.setTypeToRelatedPrimaryKey(updates, this);
			}

			if (hasChanged('relations.o2m.collection')) {
				o2m.generateRelatedCollection(updates, this);
				o2m.preventCircularConstraint(updates, this);
				o2m.updateGeneratedRelatedField(updates, this);
			}

			if (hasChanged('relations.o2m.field')) {
				o2m.useExistingRelationValues(updates, this);
				o2m.generateRelatedField(updates, this);
			}

			this.$patch(updates);
		},
		async save() {
			if (!this.collection || !this.field.field) return;

			const collectionsStore = useCollectionsStore();
			const fieldsStore = useFieldsStore();
			const relationsStore = useRelationsStore();

			const update = !!fieldsStore.getField(this.collection, this.field.field);

			this.saving = true;

			try {
				// TODO add update

				await api.post(`/fields/${this.collection}`, this.field);

				for (const [_type, value] of Object.entries(this.collections)) {
					if (!value) continue;
					await api.post('/collections', value);
				}

				for (const [_type, value] of Object.entries(this.relations)) {
					if (!value) continue;
					await api.post('/relations', value);
				}

				for (const [_type, value] of Object.entries(this.fields)) {
					if (!value) continue;
					await api.post(`/fields/${value.collection}`, value);
				}

				await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate(), relationsStore.hydrate()]);
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				this.saving = false;
			}
		},
	},
	getters: {
		// Check if the currently configured values could be saved or not. Most basic form of validation
		readyToSave(state) {
			// TODO expand later. Might wanna use validatePayload
			const requiredProperties = ['field.field', 'collection'];

			return requiredProperties.every((path) => {
				return has(state, path) && isEmpty(get(state, path)) === false;
			});
		},
		interfacesForType(): InterfaceConfig[] {
			const { interfaces } = getInterfaces();

			return orderBy(
				interfaces.value.filter((inter: InterfaceConfig) => {
					// Filter out all system interfaces
					if (inter.system === true) return false;

					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
		displaysForType(): DisplayConfig[] {
			const { displays } = getDisplays();

			return orderBy(
				displays.value.filter((inter: DisplayConfig) => {
					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
	},
});

type StateUpdates = DeepPartial<ReturnType<typeof useFieldDetailStore>['$state']>;
type State = ReturnType<typeof useFieldDetailStore>['$state'];
