import { HelperFunctions, State, StateUpdates } from '../types';
import { getInterface } from '@/interfaces';
import { set } from 'lodash';

export function applyChanges(updates: StateUpdates, _state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('field.type')) {
		setSpecialForType(updates);
		updateInterface(updates, helperFn);
	}
}

function setSpecialForType(updates: StateUpdates) {
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

function updateInterface(updates: StateUpdates, fn: HelperFunctions) {
	const interface_ = getInterface(fn.getCurrent('field.meta.interface'));
	const type = updates.field?.type;
	if (type && !interface_?.types.includes(type)) {
		set(updates, 'field.meta.interface', undefined);
	}
}
