import api from '@/api';
import { useFieldsStore } from '@/stores/';
import { Relation } from '@/types';
import { createStore } from 'pinia';

export const useRelationsStore = createStore({
	id: 'relationsStore',
	state: () => ({
		relations: [] as Relation[],
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/relations`, { params: { limit: -1 } });
			this.state.relations = response.data.data;
		},
		async dehydrate() {
			this.reset();
		},
		getRelationsForCollection(collection: string) {
			return this.state.relations.filter((relation) => {
				return relation.collection === collection || relation.related_collection === collection;
			});
		},
		/**
		 * Retrieve all relation rows that apply to the current field. Regardless of relational direction
		 */
		getRelationsForField(collection: string, field: string): Relation[] {
			const fieldsStore = useFieldsStore();
			const fieldInfo = fieldsStore.getField(collection, field);

			if (!fieldInfo) return [];

			const relations: Relation[] = this.getRelationsForCollection(collection).filter((relation: Relation) => {
				return (
					(relation.collection === collection && relation.field === field) ||
					(relation.related_collection === collection && relation.meta?.one_field === field)
				);
			});

			if (relations.length > 0) {
				const isM2M = relations[0].meta?.junction_field !== null;

				// If the relation matching the field has a junction field, it's a m2m. In that case,
				// we also want to return the secondary relationship (from the jt to the related)
				// so any ui elements (interfaces) can utilize the full relationship
				if (isM2M) {
					const secondaryRelation = this.state.relations.find((relation) => {
						return (
							relation.collection === relations[0].collection && relation.field === relations[0].meta?.junction_field
						);
					});

					if (secondaryRelation) relations.push(secondaryRelation);
				}
			}

			return relations;
		},
		/**
		 * Retrieve the passed fields relationship. This is only the current m2o foreign key relationship
		 */
		getRelationForField(collection: string, field: string): Relation | null {
			const fieldsStore = useFieldsStore();
			const fieldInfo = fieldsStore.getField(collection, field);

			if (!fieldInfo) return null;

			const relations: Relation[] = this.getRelationsForCollection(collection).filter((relation: Relation) => {
				return (
					(relation.collection === collection && relation.field === field) ||
					(relation.related_collection === collection && relation.meta?.one_field === field)
				);
			});

			return relations.find((relation) => relation.collection === collection && relation.field === field) || null;
		},
	},
});
