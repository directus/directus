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
	switch (type) {
		case 'uuid':
		case 'hash':
		case 'json':
		case 'csv':
		case 'boolean':
		case 'geometry':
			set(updates, 'field.meta.special', [type]);
			break;
		case undefined:
			break;
		default:
			set(updates, 'field.meta.special', null);
	}
}
