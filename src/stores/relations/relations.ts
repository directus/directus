import { createStore } from 'pinia';
import { Relation } from './types';
import useProjectsStore from '@/stores/projects';
import api from '@/api';
import useFieldsStore from '@/stores/fields';

export const useRelationsStore = createStore({
	id: 'relationsStore',
	state: () => ({
		relations: [] as Relation[],
	}),
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const response = await api.get(`/${currentProjectKey}/relations`);

			this.state.relations = response.data.data;
		},
		async dehydrate() {
			this.reset();
		},
		getRelationsForCollection(collection: string) {
			return this.state.relations.filter((relation) => {
				return (
					relation.collection_many === collection ||
					relation.collection_one === collection
				);
			});
		},
		getRelationsForField(collection: string, field: string) {
			const fieldsStore = useFieldsStore();
			const fieldInfo = fieldsStore.getField(collection, field);

			if (!fieldInfo) return [];

			if (fieldInfo.type === 'file') {
				return [
					{
						collection_many: collection,
						field_many: field,
						collection_one: 'directus_files',
						field_one: null,
						junction_field: null,
					},
				] as Relation[];
			}

			if (['user', 'user_created', 'user_updated', 'owner'].includes(fieldInfo.type)) {
				return [
					{
						collection_many: collection,
						field_many: field,
						collection_one: 'directus_users',
						field_one: null,
						junction_field: null,
					},
				] as Relation[];
			}

			return this.getRelationsForCollection(collection).filter((relation: Relation) => {
				return relation.field_many === field || relation.field_one === field;
			});
		},
	},
});
