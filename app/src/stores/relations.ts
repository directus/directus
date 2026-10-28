import { DeepPartial, Relation } from '@directus/types';
import { getRelations, getRelationType } from '@directus/utils';
import { isEqual } from 'lodash-es';
import { defineStore } from 'pinia';
import { computed, shallowRef } from 'vue';
import { useAiToolsStore } from '@/ai/stores/use-ai-tools';
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';

export const useRelationsStore = defineStore('relations', () => {
	const toolsStore = useAiToolsStore();

	toolsStore.onSystemToolResult(async (toolName) => {
		if (toolName === 'relations') {
			await hydrate();
		}
	});

	// Every write replaces the array, so a shallow ref is enough and keeps relations as plain objects
	const relations = shallowRef<Relation[]>([]);

	// Relations keyed by both their many (collection) and one (related_collection) side
	const relationsByCollection = computed(() => {
		const byCollection = new Map<string, Relation[]>();

		const add = (collection: string, relation: Relation) => {
			const collectionRelations = byCollection.get(collection);

			if (collectionRelations) collectionRelations.push(relation);
			else byCollection.set(collection, [relation]);
		};

		for (const relation of relations.value) {
			add(relation.collection, relation);

			if (relation.related_collection && relation.related_collection !== relation.collection) {
				add(relation.related_collection, relation);
			}
		}

		return byCollection;
	});

	const hydrate = async () => {
		const response = await api.get(`/relations`);
		relations.value = response.data.data;
	};

	const dehydrate = () => {
		relations.value = [];
	};

	const getRelationsForCollection = (collection: string) => {
		// Copy so callers can mutate the result without touching the cached array
		return [...(relationsByCollection.value.get(collection) ?? [])];
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

		const scopedRelations = getRelations(relationsByCollection.value.get(collection) ?? [], collection, field);

		if (scopedRelations.length > 0) {
			const firstRelation = scopedRelations[0] as Relation;

			const isM2M = firstRelation.meta?.junction_field !== null;

			// If the relation matching the field has a junction field, it's a m2m. In that case,
			// we also want to return the secondary relationship (from the jt to the related)
			// so any ui elements (interfaces) can utilize the full relationship
			if (isM2M) {
				const secondaryRelation = relationsByCollection.value.get(firstRelation.collection)?.find((relation) => {
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

		return (
			relationsByCollection.value
				.get(collection)
				?.find((relation) => relation.collection === collection && relation.field === field) ?? null
		);
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
