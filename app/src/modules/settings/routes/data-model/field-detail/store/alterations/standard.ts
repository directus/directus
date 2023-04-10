import { HelperFunctions, State, StateUpdates } from '../types';
import { getInterface } from '@/interfaces';
import { set } from 'lodash';
import { getSpecialForType } from '@/utils/get-special-for-type';

export function applyChanges(updates: StateUpdates, _state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('field.type')) {
		setSpecialForType(updates);
		updateInterface(updates, helperFn);
	}
}

function setSpecialForType(updates: StateUpdates) {
	const type = updates.field?.type;
	if (type === undefined) return;
	const special = getSpecialForType(type);
	set(updates, 'field.meta.special', special);
}

function updateInterface(updates: StateUpdates, fn: HelperFunctions) {
	const interface_ = getInterface(fn.getCurrent('field.meta.interface'));
	const type = updates.field?.type;
	if (type && !interface_?.types.includes(type)) {
		set(updates, 'field.meta.interface', undefined);
	}
}
