import { set } from 'lodash';
import { State, StateUpdates } from '../types';
import { getInterfaces } from '@/interfaces';

/**
 * In case a relational field removed the schema object, we'll have to make sure it's re-added
 * for the other types
 */
export function resetSchema(updates: StateUpdates, state: State) {
	if (state.field.schema === undefined) {
		set(updates, 'field.schema', {});
	}
}

/**
 * When an interface is chosen before a local type is set (which is the case when using the
 * simple flow), we'll set the localType to match whatever the first supported localType is of
 * the interface
 */
export function setLocalTypeForInterface(updates: StateUpdates) {
	if (!updates.field?.meta?.interface) return;

	const chosenInterface = getInterfaces().interfaces.value.find((inter) => inter.id === updates.field!.meta!.interface);

	if (!chosenInterface) return;

	const localType = chosenInterface?.localTypes?.[0] ?? 'standard';
	set(updates, 'localType', localType);
}

/**
 * Default to the first available type for this interface, if the currently selected type doesn't
 * work with this interface. Makes sure you never end up saving like "Geometry" for a "Boolean"
 * field etc.
 */
export function setTypeForInterface(updates: StateUpdates, state: State) {
	if (!updates.field?.meta?.interface) return;

	const chosenInterface = getInterfaces().interfaces.value.find((inter) => inter.id === updates.field!.meta!.interface);

	if (!chosenInterface) return updates;

	if (state.field.type && chosenInterface.types.includes(state.field.type)) return;

	const defaultType = chosenInterface?.types[0];
	set(updates, 'field.type', defaultType);
}

/**
 * Make sure the special flag matches the relational/presentation localType. This isn't used when
 * the local type is standard
 */
export function setSpecialForLocalType(updates: StateUpdates) {
	if (updates?.localType === 'o2m') {
		set(updates, 'field.meta.special', ['o2m']);
	}

	if (updates?.localType === 'm2m') {
		set(updates, 'field.meta.special', ['m2m']);
	}

	if (updates?.localType === 'm2a') {
		set(updates, 'field.meta.special', ['m2a']);
	}

	if (updates?.localType === 'm2o') {
		set(updates, 'field.meta.special', ['m2o']);
	}

	if (updates?.localType === 'translations') {
		set(updates, 'field.meta.special', ['translations']);
	}

	if (updates?.localType === 'file') {
		set(updates, 'field.meta.special', ['file']);
	}

	if (updates?.localType === 'files') {
		set(updates, 'field.meta.special', ['files']);
	}

	if (updates?.localType === 'presentation') {
		set(updates, 'field.meta.special', ['alias', 'no-data']);
	}

	if (updates?.localType === 'group') {
		set(updates, 'field.meta.special', ['alias', 'no-data', 'group']);
	}
}

export function resetRelations(updates: StateUpdates) {
	if (!updates.relations) updates.relations = {};
	updates.relations.m2a = undefined;
	updates.relations.m2o = undefined;
	updates.relations.o2m = undefined;
}
