import { useExtension } from '@/composables/use-extension';
import { set } from 'lodash';
import { State, StateUpdates } from '../types';

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

	const chosenInterface = useExtension('interface', updates.field.meta.interface);

	if (!chosenInterface.value) return;

	const localType = chosenInterface.value?.localTypes?.[0] ?? 'standard';
	set(updates, 'localType', localType);
}

/**
 * Default to the first available type for this interface, if the currently selected type doesn't
 * work with this interface. Makes sure you never end up saving like "Geometry" for a "Boolean"
 * field etc.
 */
export function setTypeForInterface(updates: StateUpdates, state: State) {
	if (!updates.field?.meta?.interface) return;

	const chosenInterface = useExtension('interface', updates.field.meta.interface);

	if (!chosenInterface.value) return updates;

	if (state.field.type && chosenInterface.value.types.includes(state.field.type)) return;

	const defaultType = chosenInterface.value?.types[0];
	set(updates, 'field.type', defaultType);
}

/**
 * Make sure the special flag matches the relational/presentation localType. This isn't used when
 * the local type is standard
 */
export function setSpecialForLocalType(updates: StateUpdates) {
	const localType = updates?.localType;

	switch (localType) {
		case 'o2m':
		case 'm2m':
		case 'm2a':
		case 'm2o':
		case 'translations':
		case 'file':
		case 'files':
			set(updates, 'field.meta.special', [localType]);
			break;
		case 'presentation':
			set(updates, 'field.meta.special', ['alias', 'no-data']);
			break;
		case 'group':
			set(updates, 'field.meta.special', ['alias', 'no-data', 'group']);
			break;
	}
}

export function resetRelations(updates: StateUpdates) {
	if (!updates.relations) updates.relations = {};
	updates.relations.m2o = undefined;
	updates.relations.o2m = undefined;
}
