import { useExtension } from '@/composables/use-extension';
import { useFieldDetailStore } from '../index';
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
 * When an interface is chosen, we set the localType to match the interface's supported localTypes.
 * If the localType is already compatible with the interface, we keep it.
 * If not, we fall back to the first supported localType.
 */
export function setLocalTypeForInterface(updates: StateUpdates) {
	if (!updates.field?.meta?.interface) return;

	const chosenInterface = useExtension('interface', updates.field.meta.interface);

	if (!chosenInterface.value) return;

	// Get the localType from the store state
	const fieldDetailStore = useFieldDetailStore();
	const currentLocalType = fieldDetailStore.localType;

	// Check if localType is compatible with interface
	const supportedLocalTypes = chosenInterface.value?.localTypes ?? ['standard'];
	const isCurrentTypeCompatible = supportedLocalTypes.length > 0 && supportedLocalTypes.includes(currentLocalType);

	// Use localType if compatible, otherwise use first supported type or fallback to standard
	const localType = isCurrentTypeCompatible ? currentLocalType : (supportedLocalTypes[0] ?? 'standard');
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

export function switchInterfaceAndDisplay(updates: StateUpdates) {
	let targetInterface = undefined;

	if (updates.localType === 'files') {
		targetInterface = 'files';
	} else if (updates.localType === 'file') {
		targetInterface = 'file';
	}

	set(updates, 'field.meta.interface', targetInterface);
	set(updates, 'field.meta.options', undefined);
	set(updates, 'field.meta.display', undefined);
	set(updates, 'field.meta.display_options', undefined);
}
