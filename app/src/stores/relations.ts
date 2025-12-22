import { useAiStore } from '@/ai/stores/use-ai';
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { DeepPartial, Relation } from '@directus/types';
import { getRelations, getRelationType } from '@directus/utils';
import { isEqual } from 'lodash';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRelationsStore = defineStore('relations', () => {
	const aiStore = useAiStore();

	aiStore.onSystemToolResult(async (toolName) => {
		if (toolName === 'relations') {
			await hydrate();
		}
	});

	const relations = ref<Relation[]>([]);

	const hydrate = async () => {
		const response = await api.get(`/relations`);
		relations.value = response.data.data;
	};

	const dehydrate = () => {
		relations.value = [];
	};

	const getRelationsForCollection = (collection: string) => {
		return relations.value.filter((relation) => {
			return relation.collection === collection || relation.related_collection === collection;
		});
	};

	const upsertRelation = async (collection: string, field: string, values: DeepPartial<Relation>) => {
		const existing = getRelationForField(collection, field);

		if (existing) {
			if (isEqual(existing, values)) return;

			const updatedRelationResponse = await api.patch<{ data: Relation }>(`/relations/${collection}/${field}`, values);

			relations.value = relations.value.map((relation) => {
				if (relation.collection === collection && relation.field === field) {
					return updatedRelationResponse.data.data;
				}

				return relation;
			});
		} else {
			const createdRelationResponse = await api.post<{ data: Relation }>(`/relations`, values);

			relations.value = [...relations.value, createdRelationResponse.data.data];
		}
	};

	/**
	 * Retrieve all relation rows that apply to the current field. Regardless of relational direction
	 */
	const getRelationsForField = (collection: string, field: string): Relation[] => {
		const fieldsStore = useFieldsStore();
		const fieldInfo = fieldsStore.getField(collection, field);

		if (!fieldInfo) return [];

		const scopedRelations = getRelations(getRelationsForCollection(collection), collection, field);

		if (scopedRelations.length > 0) {
			const firstRelation = scopedRelations[0] as Relation;

			const isM2M = firstRelation.meta?.junction_field !== null;

			// If the relation matching the field has a junction field, it's a m2m. In that case,
			// we also want to return the secondary relationship (from the jt to the related)
			// so any ui elements (interfaces) can utilize the full relationship
			if (isM2M) {
				const secondaryRelation = relations.value.find((relation) => {
					return (
						relation.collection === firstRelation.collection &&
						relation.field === firstRelation.meta?.junction_field &&
						relation.meta?.junction_field === firstRelation.field
					);
				});

				if (secondaryRelation) scopedRelations.push(secondaryRelation);
			}
		}

		return scopedRelations;
	};

	/**
	 * Retrieve the passed fields relationship. This is only the current m2o foreign key relationship
	 */
	const getRelationForField = (collection: string, field: string): Relation | null => {
		const fieldsStore = useFieldsStore();
		const fieldInfo = fieldsStore.getField(collection, field);

		if (!fieldInfo) return null;

		const relations = getRelationsForCollection(collection);
		return relations.find((relation) => relation.collection === collection && relation.field === field) ?? null;
	};

	return {
		relations,
		hydrate,
		dehydrate,
		getRelationsForCollection,
		upsertRelation,
		getRelationForField,
		getRelationsForField,
		getRelationType,
	};
});
