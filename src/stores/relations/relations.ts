import { createStore } from 'pinia';
import { Relation } from './types';
import api from '@/api';
import useFieldsStore from '@/stores/fields';

export const useRelationsStore = createStore({
	id: 'relationsStore',
	state: () => ({
		relations: [] as Relation[],
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/relations`);

			this.state.relations = response.data.data;
		},
		async dehydrate() {
			this.reset();
		},
		getRelationsForCollection(collection: string) {
			return this.state.relations.filter((relation) => {
				return relation.collection_many === collection || relation.collection_one === collection;
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

			const relations = this.getRelationsForCollection(collection).filter((relation: Relation) => {
				return relation.field_many === field || relation.field_one === field;
			});

			if (relations.length > 0) {
				const isM2M = relations[0].junction_field !== null;

				// If the relation matching the field has a junction field, it's a m2m. In that case,
				// we also want to return the secondary relationship (from the jt to the related)
				// so any ui elements (interfaces) can utilize the full relationship
				if (isM2M) {
					const secondaryRelation = this.state.relations.find((relation) => {
						return (
							relation.collection_many === relations[0].collection_many &&
							relation.field_many === relations[0].junction_field
						);
					});

					if (secondaryRelation) relations.push(secondaryRelation);
				}
			}

			return relations;
		},
	},
});
