import { defineStore, SubscriptionCallback } from 'pinia';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { has, isEmpty, isNil, orderBy } from 'lodash';
import { InterfaceConfig, DisplayConfig, DeepPartial, Field, Relation, Collection } from '@directus/shared/types';
import { LOCAL_TYPES } from '@directus/shared/constants';
import { computed } from 'vue';
import { get, set } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores';
import api from '@/api';

export function syncFieldDetailStoreProperty(path: string, defaultValue?: any) {
	const fieldDetailStore = useFieldDetailStore();

	return computed({
		get() {
			return get(fieldDetailStore, path, defaultValue);
		},
		set(val: any) {
			fieldDetailStore.update(set({}, path, val));
		},
	});
}

export const useFieldDetailStore = defineStore({
	id: 'field-detail',
	state: () => ({
		// The current collection we're operating in
		collection: null,

		// Current field to be created / edited
		field: {
			field: undefined,
			type: undefined,
			schema: undefined,
			meta: undefined,
		} as DeepPartial<Field>,

		// Any new relations/collections/fields that need to be upserted
		relations: [] as DeepPartial<Relation>[],
		collections: [] as DeepPartial<Collection>[],
		fields: [] as DeepPartial<Field>[],

		// Any items that need to be injected into any collection
		items: {} as Record<string, Record<string, any>[]>,

		// Various flags that alter the operations of watchers and getters
		flags: {
			localType: 'standard' as typeof LOCAL_TYPES[number],
			autoGenerateJunctionRelation: true,
		},

		saving: false,
	}),
	actions: {
		update(updates: Record<string, any>) {
			const hasChanged = (path: string) => has(updates, path) && get(updates, path) !== get(this, path);

			if (hasChanged('field.meta.interface')) {
				setLocalTypeForInterface(updates, this);
				setTypeForInterface(updates, this);
			}

			// TODO remove this in favor of actual "setSchemaFortype" or whatever
			set(updates, 'field.schema', {});

			// TODO add remaining magic

			this.$patch(updates);
		},
		async save() {
			if (!this.collection || !this.field.field) return;

			const collectionsStore = useCollectionsStore();
			const fieldsStore = useFieldsStore();
			const relationsStore = useRelationsStore();

			const update = !!fieldsStore.getField(this.collection, this.field.field);

			this.saving = true;

			try {
				// if (update) { } else {
				await api.post(`/fields/${this.collection}`, this.field);
				// }

				await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate(), relationsStore.hydrate()]);
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				this.saving = false;
			}
		},
	},
	getters: {
		// Check if the currently configured values could be saved or not. Most basic form of validation
		readyToSave(state) {
			// TODO expand later. Might wanna use validatePayload
			const requiredProperties = ['field.field', 'collection'];

			return requiredProperties.every((path) => {
				console.log(get(state, path));
				return has(state, path) && isEmpty(get(state, path)) === false;
			});
		},
		interfacesForType(): InterfaceConfig[] {
			const { interfaces } = getInterfaces();

			return orderBy(
				interfaces.value.filter((inter: InterfaceConfig) => {
					// Filter out all system interfaces
					if (inter.system === true) return false;

					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.flags.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
		displaysForType(): DisplayConfig[] {
			const { displays } = getDisplays();

			return orderBy(
				displays.value.filter((inter: DisplayConfig) => {
					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.flags.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
	},
});

type StateUpdates = DeepPartial<ReturnType<typeof useFieldDetailStore>['$state']>;
type State = ReturnType<typeof useFieldDetailStore>['$state'];

/**
 * Make sure the local type matches the currently selected interface
 */
function setLocalTypeForInterface(updates: StateUpdates, _state: State) {
	if (!updates.field?.meta?.interface) return;

	const chosenInterface = getInterfaces().interfaces.value.find((inter) => inter.id === updates.field!.meta!.interface);

	if (!chosenInterface) return;

	const localType = chosenInterface?.localTypes?.[0] ?? 'standard';
	set(updates, 'flags.localType', localType);
}

/**
 * Reset the field's type when the interface changes to an interface that doesn't support the
 * currently configured type
 */
function setTypeForInterface(updates: StateUpdates, state: State) {
	if (!updates.field?.meta?.interface) return;

	const chosenInterface = getInterfaces().interfaces.value.find((inter) => inter.id === updates.field!.meta!.interface);

	if (!chosenInterface) return updates;

	if (state.field.type && chosenInterface.types.includes(state.field.type)) return;

	const defaultType = chosenInterface?.types[0];
	set(updates, 'field.type', defaultType);
}
