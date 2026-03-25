import { set } from 'lodash';
import { HelperFunctions, State, StateUpdates } from '../types';

export function applyChanges(updates: StateUpdates, state: State, helperFn: HelperFunctions) {
	const { hasChanged } = helperFn;

	clearReadonly(updates);
	clearRequired(updates);

	if (hasChanged('localType')) {
		removeSchema(updates);
		setTypeToAlias(updates);
		setSpecialToNoData(updates);
	}
}

export function removeSchema(updates: StateUpdates) {
	set(updates, 'field.schema', undefined);
}

export function setTypeToAlias(updates: StateUpdates) {
	set(updates, 'field.type', 'alias');
}

export function setSpecialToNoData(updates: StateUpdates) {
	set(updates, 'field.meta.special', ['alias', 'no-data']);
}

export function clearReadonly(updates: StateUpdates) {
	set(updates, 'field.meta.readonly', false);
}

export function clearRequired(updates: StateUpdates) {
	set(updates, 'field.meta.required', false);
}
