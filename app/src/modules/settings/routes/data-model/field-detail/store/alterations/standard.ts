import { HelperFunctions, State, StateUpdates } from '../types';
import { useExtension } from '@/composables/use-extension';
import { getSpecialForType } from '@/utils/get-special-for-type';
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
	if (type === undefined) return;
	const special = getSpecialForType(type);
	set(updates, 'field.meta.special', special);
}

function updateInterface(updates: StateUpdates, fn: HelperFunctions) {
	const inter = useExtension('interface', fn.getCurrent('field.meta.interface'));

	const type = updates.field?.type;

	if (type && !inter.value?.types.includes(type)) {
		set(updates, 'field.meta.interface', undefined);
	}
}
