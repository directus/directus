import { set } from 'lodash';
import { HelperFunctions, State, StateUpdates } from '../types';
import { setRelatedOneFieldForCorrespondingField } from './m2o';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged, getCurrent } = helperFn;

	if (hasChanged('localType')) {
		setTypeToUUID(updates);
		prepareRelation(updates, state);
	}

	if (hasChanged('field.field')) {
		updateRelationField(updates);
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

export function setTypeToUUID(updates: StateUpdates) {
	set(updates, 'field.type', 'uuid');
}

export function prepareRelation(updates: StateUpdates, state: State) {
	// Add if existing
	if (!updates.relations) updates.relations = {};

	updates.relations.m2o = {
		collection: state.collection,
		field: state.field.field,
		related_collection: 'directus_files',
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
