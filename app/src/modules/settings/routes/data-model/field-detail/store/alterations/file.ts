import { StateUpdates, State, HelperFunctions } from '../types';
import { set } from 'lodash';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('localType')) {
		setTypeToUUID(updates);
		prepareRelation(updates, state);
	}

	if (hasChanged('field.field')) {
		updateRelationField(updates);
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
