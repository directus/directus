import { HelperFunctions, State, StateUpdates } from '../types';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { set } from 'lodash';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged, getCurrent } = helperFn;

	if (hasChanged('localType')) {
		prepareRelation(updates, state);
	}

	if (hasChanged('field.field')) {
		updateRelationField(updates);
	}

	if (hasChanged('relations.m2o.related_collection')) {
		generateRelatedCollection(updates);
		preventCircularConstraint(updates, state);
		setTypeToRelatedPrimaryKey(updates, state);
	}

	if (hasChanged('fields.corresponding')) {
		setRelatedOneFieldForCorrespondingField(updates);
	}

	if (hasChanged('field.schema.is_nullable')) {
		if (updates.field?.schema?.is_nullable === false && getCurrent('relations.m2o.schema.on_delete') === 'SET NULL') {
			set(updates, 'relations.m2o.schema.on_delete', 'NO ACTION');
		}
	}
}

export function prepareRelation(updates: StateUpdates, state: State) {
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
}

export function updateRelationField(updates: StateUpdates) {
	if (!updates.field?.field) return;

	if (!updates.relations?.m2o) updates.relations = { m2o: {} };
	set(updates, 'relations.m2o.field', updates.field.field);
}

export function generateRelatedCollection(updates: StateUpdates) {
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
}

export function preventCircularConstraint(updates: StateUpdates, state: State) {
	const relatedCollection = updates.relations?.m2o?.related_collection;
	if (!relatedCollection) return;
	if (!updates.relations) updates.relations = {};

	if (relatedCollection === state.collection) {
		set(updates, 'relations.m2o.schema.on_delete', 'NO ACTION');
	}
}

export function setTypeToRelatedPrimaryKey(updates: StateUpdates, state: State) {
	const relatedCollection = updates.relations?.m2o?.related_collection;
	if (!relatedCollection) return;

	const fieldsStore = useFieldsStore();

	const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

	if (primaryKeyField) {
		set(updates, 'field.type', primaryKeyField.type);
	} else if (state.collections.related?.fields?.[0]?.type) {
		set(updates, 'field.type', state.collections.related.fields[0].type);
	}
}

export function setRelatedOneFieldForCorrespondingField(updates: StateUpdates) {
	if (updates?.fields?.corresponding?.field) {
		set(updates, 'relations.m2o.meta.one_field', updates.fields.corresponding.field);
	}

	if (!updates.fields?.corresponding) {
		set(updates, 'relations.m2o.meta.one_field', null);
	}
}
