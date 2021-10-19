import { defineStore } from 'pinia';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { orderBy } from 'lodash';
import { InterfaceConfig, DisplayConfig, DeepPartial, Field, Relation, Collection } from '@directus/shared/types';
import { LOCAL_TYPES } from '@directus/shared/constants';

export const useFieldDetailStore = defineStore({
	id: 'field-detail',
	state: () => ({
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
	}),
	getters: {
		interfacesForType() {
			const { interfaces } = getInterfaces();

			return orderBy(
				interfaces.value.filter((inter: InterfaceConfig) => {
					// Filter out all system interfaces
					if (inter.system === true) return false;

					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.groups || ['standard']).includes(this.flags.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
		displaysForType() {
			const { displays } = getDisplays();

			return orderBy(
				displays.value.filter((inter: DisplayConfig) => {
					const matchesType = inter.types.includes(this.field.type || 'alias');
					const matchesLocalType = (inter.groups || ['standard']).includes(this.flags.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
	},
});
