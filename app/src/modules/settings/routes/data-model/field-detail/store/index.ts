import { defineStore } from 'pinia';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { has, isEmpty, orderBy } from 'lodash';
import { InterfaceConfig, DisplayConfig, DeepPartial, Field, Relation, Collection } from '@directus/shared/types';
import { LOCAL_TYPES } from '@directus/shared/constants';
import { computed } from 'vue';
import { get, set } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores';
import api from '@/api';

import * as global from './alterations/global';
import * as file from './alterations/file';
import * as files from './alterations/files';
import * as group from './alterations/group';
import * as m2a from './alterations/m2a';
import * as m2m from './alterations/m2m';
import * as m2o from './alterations/m2o';
import * as o2m from './alterations/o2m';
import * as presentation from './alterations/presentation';
import * as standard from './alterations/standard';
import * as translations from './alterations/translations';

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
	id: 'fieldDetailStore',
	state: () => ({
		// The current collection we're operating in
		collection: undefined as string | undefined,

		// What field we're currently editing ("+"" for new)
		editing: '+' as string,

		// Field edits
		field: {
			field: undefined,
			type: undefined,
			schema: {},
			meta: {},
		} as DeepPartial<Field>,

		// Relations that will be upserted as part of this change
		relations: {
			m2o: undefined as DeepPartial<Relation> | undefined,
			o2m: undefined as DeepPartial<Relation> | undefined,
			m2a: undefined as DeepPartial<Relation> | undefined,
		},

		// Collections that will be upserted as part of this change
		collections: {
			junction: undefined as DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined,
			related: undefined as DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined,
		},

		// Fields that will be upserted as part of this change
		fields: {
			corresponding: undefined as DeepPartial<Field> | undefined,
			junctionCurrent: undefined as DeepPartial<Field> | undefined,
			junctionRelated: undefined as DeepPartial<Field> | undefined,
			sort: undefined as DeepPartial<Field> | undefined,
		},

		// Any items that need to be injected into any collection
		items: {} as Record<string, Record<string, any>[]>,

		// Various flags that alter the operations of watchers and getters
		localType: 'standard' as typeof LOCAL_TYPES[number],
		autoGenerateJunctionRelation: true,
		saving: false,
	}),
	actions: {
		startEditing(field: string) {
			// TODO pull existing values if not +
			this.editing = field;
		},
		update(updates: DeepPartial<typeof this.$state>) {
			const hasChanged = (path: string) => has(updates, path) && get(updates, path) !== get(this, path);
			const getCurrent = (path: string) => (has(updates, path) ? get(updates, path) : get(this, path));

			const helperFn = { hasChanged, getCurrent };

			if (hasChanged('field.meta.interface')) {
				global.setLocalTypeForInterface(updates);
				global.setTypeForInterface(updates, this);
			}

			if (hasChanged('localType')) {
				global.resetSchema(updates, this);
				global.resetRelations(updates);
				global.setSpecialForLocalType(updates);
			}

			switch (getCurrent('localType')) {
				case 'file':
					file.applyChanges(updates, this, helperFn);
					break;
				case 'files':
					files.applyChanges(updates, this, helperFn);
					break;
				case 'group':
					group.applyChanges(updates, this, helperFn);
					break;
				case 'm2a':
					m2a.applyChanges(updates, this, helperFn);
					break;
				case 'm2m':
					m2m.applyChanges(updates, this, helperFn);
					break;
				case 'm2o':
					m2o.applyChanges(updates, this, helperFn);
					break;
				case 'o2m':
					o2m.applyChanges(updates, this, helperFn);
					break;
				case 'presentation':
					presentation.applyChanges(updates, this, helperFn);
					break;
				case 'standard':
					standard.applyChanges(updates, this, helperFn);
					break;
				case 'translations':
					translations.applyChanges(updates, this, helperFn);
					break;
			}

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
				// TODO add update

				await api.post(`/fields/${this.collection}`, this.field);

				for (const [_type, value] of Object.entries(this.collections)) {
					if (!value) continue;
					await api.post('/collections', value);
				}

				for (const [_type, value] of Object.entries(this.fields)) {
					if (!value) continue;
					await api.post(`/fields/${value.collection}`, value);
				}

				for (const [_type, value] of Object.entries(this.relations)) {
					if (!value) continue;
					await api.post('/relations', value);
				}

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
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.localType);

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
					const matchesLocalType = (inter.localTypes || ['standard']).includes(this.localType);

					return matchesType && matchesLocalType;
				}),
				['name']
			);
		},
		generationInfo() {
			const items: { name: string; type: 'collection' | 'field' }[] = [];

			for (const collection of Object.values(this.collections)) {
				if (!collection || !collection.collection) continue;

				items.push({
					name: collection.collection,
					type: 'collection',
				});
			}

			for (const field of Object.values(this.fields)) {
				if (!field || !field.collection || !field.field) continue;

				items.push({
					name: `${field.collection}.${field.field}`,
					type: 'field',
				});
			}

			return items;
		},
	},
});
