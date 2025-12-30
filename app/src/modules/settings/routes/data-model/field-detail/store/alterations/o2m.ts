import { HelperFunctions, State, StateUpdates } from '../types';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { set } from 'lodash';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('localType')) {
		removeSchema(updates);
		setTypeToAlias(updates);
		prepareRelation(updates, state);
	}

	if (hasChanged('field.field')) {
		updateRelationField(updates);
	}

	if (hasChanged('relations.o2m.collection')) {
		generateRelatedCollection(updates);
		preventCircularConstraint(updates, state);
		updateGeneratedRelatedField(updates, state);
		generateSortField(updates, state, helperFn);
	}

	if (hasChanged('relations.o2m.field')) {
		useExistingRelationValues(updates);
		generateRelatedField(updates, state);
	}

	if (hasChanged('relations.o2m.meta.sort_field')) {
		generateSortField(updates, state, helperFn);
	}
}

export function removeSchema(updates: StateUpdates) {
	set(updates, 'field.schema', undefined);
}

export function setTypeToAlias(updates: StateUpdates) {
	set(updates, 'field.type', 'alias');
}

export function prepareRelation(updates: StateUpdates, state: State) {
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
}

export function preventCircularConstraint(updates: StateUpdates, state: State) {
	const collection = updates.relations?.o2m?.collection;
	if (!collection) return;
	if (!updates.relations) updates.relations = {};

	if (collection === state.collection) {
		set(updates, 'relations.o2m.schema.on_delete', 'NO ACTION');
	}
}

export function updateRelationField(updates: StateUpdates) {
	if (!updates.field?.field) return;

	if (!updates.relations?.o2m) updates.relations = { o2m: {} };
	set(updates, 'relations.o2m.meta.one_field', updates.field.field);
}

export function useExistingRelationValues(updates: StateUpdates) {
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
}

export function generateRelatedCollection(updates: StateUpdates) {
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
}

export function generateRelatedField(updates: StateUpdates, state: State) {
	const fieldsStore = useFieldsStore();
	const collection = updates.relations?.o2m?.collection ?? state.relations.o2m?.collection;
	if (!collection) return;

	const currentCollectionPrimaryKeyFieldType = state.collection
		? (fieldsStore.getPrimaryKeyFieldForCollection(state.collection)?.type ?? 'integer')
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
			meta: {
				interface: 'select-dropdown-m2o',
				hidden: true,
			},
		};
	}
}

export function updateGeneratedRelatedField(updates: StateUpdates, state: State) {
	const collection = updates.relations?.o2m?.collection;
	if (!collection) return;

	if (state.fields.corresponding) {
		set(updates, 'fields.corresponding.collection', collection);
	}
}

function fieldExists(collection: string, field: string) {
	return !!useFieldsStore().getField(collection, field);
}

export function generateSortField(updates: StateUpdates, state: State, { getCurrent }: HelperFunctions) {
	const relatedCollection = getCurrent('relations.o2m.collection');
	const sort = getCurrent('relations.o2m.meta.sort_field');

	if (relatedCollection && sort && fieldExists(relatedCollection, sort) === false) {
		set(updates, 'fields.sort', {
			collection: relatedCollection,
			field: sort,
			type: 'integer',
			schema: {},
			meta: {
				hidden: true,
			},
		});
	} else {
		set(updates, 'fields.sort', undefined);
	}
}
