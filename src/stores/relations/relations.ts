import { createStore } from 'pinia';
import { Relation } from './types';
import useProjectsStore from '@/stores/projects';
import api from '@/api';

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
		getRelationForField(collection: string, field: string) {
			return this.state.relations.filter((relation) => {
				return (
					(relation.collection_many === collection && relation.field_many === field) ||
					(relation.collection_one === collection && relation.field_one === field)
				);
			});
		},
	},
});
