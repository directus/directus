import { HelperFunctions, State, StateUpdates } from '../types';
import { set } from 'lodash';

export function applyChanges(updates: StateUpdates, _state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('field.type')) {
		setSpecialForType(updates);
	}
}

export function setSpecialForType(updates: StateUpdates) {
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
}
