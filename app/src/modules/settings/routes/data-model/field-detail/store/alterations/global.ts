import { set } from 'lodash-es';
import { useFieldDetailStore } from '../index';
import { State, StateUpdates } from '../types';
import { useExtension } from '@/composables/use-extension';

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
 * When an interface with a `suggestedKey` is chosen while creating a new field, pre-fill the field
 * key with that value. Only applies while the key is still empty (or still equal to the previous
 * interface's suggestion), so it never overwrites a key the user entered themselves.
 */
export function setKeyForInterface(updates: StateUpdates, state: State) {
	// Never touch the key of an existing field
	if (state.editing !== '+') return;

	const previousInterface = state.field.meta?.interface;

	const previousSuggestedKey = previousInterface
		? useExtension('interface', previousInterface).value?.suggestedKey
		: undefined;

	const chosenInterface = updates.field?.meta?.interface;
	const suggestedKey = chosenInterface ? useExtension('interface', chosenInterface).value?.suggestedKey : undefined;

	const currentKey = updates.field?.field ?? state.field.field;

	if (suggestedKey) {
		if (!currentKey || currentKey === previousSuggestedKey) {
			set(updates, 'field.field', suggestedKey);
		}
	} else if (previousSuggestedKey && currentKey === previousSuggestedKey) {
		// Clear an untouched suggestion when switching to an interface without one
		set(updates, 'field.field', null);
	}
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
