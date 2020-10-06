import { Ref, computed } from '@vue/composition-api';
import { FieldTree } from './types';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Field, Relation } from '@/types';

export default function useFieldTree(collection: Ref<string>, inject?: { fields: Field[]; relations: Relation[] }) {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const tree = computed<FieldTree[]>(() => {
		return [...fieldsStore.getFieldsForCollection(collection.value), ...(inject?.fields || [])]
			.filter((field: Field) => {
				const shown =
					field.meta?.special?.includes('alias') !== true &&
					field.meta?.special?.includes('no-data') !== true;
				return shown;
			})
			.map((field: Field) => parseField(field, []));

		function parseField(field: Field, parents: Field[]) {
			const fieldInfo: FieldTree = {
				field: field.field,
				name: field.name,
			};

			if (parents.length === 2) {
				return fieldInfo;
			}

			const relations = [
				...relationsStore.getRelationsForField(field.collection, field.field),
				...(inject?.relations || []).filter(
					(relation) =>
						(relation.many_collection === field.collection && relation.many_field === field.field) ||
						(relation.one_collection === field.collection && relation.one_field === field.field)
				),
			];

			if (relations.length > 0) {
				const relatedFields = relations
					.map((relation: Relation) => {
						const relatedCollection =
							relation.many_collection === field.collection
								? relation.one_collection
								: relation.many_collection;

						if (relation.junction_field === field.field) return [];

						return fieldsStore.getFieldsForCollection(relatedCollection).filter((field: Field) => {
							const shown =
								field.meta?.special?.includes('alias') !== true &&
								field.meta?.special?.includes('no-data') !== true;
							return shown;
						});
					})
					.flat()
					.map((childField: Field) => parseField(childField, [...parents, field]));

				fieldInfo.children = relatedFields;
			}

			return fieldInfo;
		}
	});

	return { tree };
}
