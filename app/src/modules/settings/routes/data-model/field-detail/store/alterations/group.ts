import { set } from 'lodash';
import { HelperFunctions, State, StateUpdates } from '../types';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	if (hasChanged('localType')) {
		removeSchema(updates);
		setTypeToAlias(updates);
		setSpecialToGroup(updates);
	}
}

export function removeSchema(updates: StateUpdates) {
	set(updates, 'field.schema', undefined);
}

export function setTypeToAlias(updates: StateUpdates) {
	set(updates, 'field.type', 'alias');
}

export function setSpecialToGroup(updates: StateUpdates) {
	set(updates, 'field.meta.special', ['alias', 'no-data', 'group']);
}
