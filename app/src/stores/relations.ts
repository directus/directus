import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { Relation, DeepPartial } from '@directus/types';
import { getRelationType } from '@directus/utils';
import { isEqual } from 'lodash';
import { defineStore } from 'pinia';

export const useRelationsStore = defineStore({
	id: 'relationsStore',
	state: () => ({
		relations: [] as Relation[],
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/relations`);
			this.relations = response.data.data;
		},
		async dehydrate() {
			this.$reset();
		},
		getRelationsForCollection(collection: string) {
			return this.relations.filter((relation) => {
				return relation.collection === collection || relation.related_collection === collection;
			});
		},
		async upsertRelation(collection: string, field: string, values: DeepPartial<Relation>) {
			const existing = this.getRelationForField(collection, field);

			try {
				if (existing) {
					if (isEqual(existing, values)) return;

					const updatedRelationResponse = await api.patch<{ data: Relation }>(
						`/relations/${collection}/${field}`,
						values
					);

					this.relations = this.relations.map((relation) => {
						if (relation.collection === collection && relation.field === field) {
							return updatedRelationResponse.data.data;
						}

						return relation;
					});
				} else {
					const createdRelationResponse = await api.post<{ data: Relation }>(`/relations`, values);

					this.relations = [...this.relations, createdRelationResponse.data.data];
				}
			} catch (err: any) {
				unexpectedError(err);
			}
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
					const secondaryRelation = this.relations.find((relation) => {
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
		/**
		 * Get a list of all relation types the path is made of
		 * @param collection The starting collection
		 * @param path The path to digest
		 * @returns An array of types of the relations
		 */
		getRelationTypes(collection: string, path: string): ('m2a' | 'o2m' | 'm2o')[] {
			if (!path.includes('.')) return [];

			const parts = path.split('.');

			const currentField = parts[0].includes(':') ? parts[0].split(':')[0] : parts[0];

			const relation = this.getRelationsForField(collection, currentField).find(
				(relation) => relation.collection === collection || relation.related_collection === collection
			);

			if (!relation) return [];

			const type = getRelationType({
				collection: collection,
				field: currentField,
				relation,
			});

			switch (type) {
				case 'o2m':
					return ['o2m', ...this.getRelationTypes(relation.collection, parts.slice(1).join('.'))];
				case 'm2o':
					if (!relation.related_collection) return [];
					return ['m2o', ...this.getRelationTypes(relation.related_collection, parts.slice(1).join('.'))];
				case 'm2a':
					if (!relation.meta?.one_allowed_collections) return ['m2a'];
					return ['m2a', ...this.getRelationTypes(parts[0].split(':')[1], parts.slice(1).join('.'))];
			}

			return [];
		},
	},
});
