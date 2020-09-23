import { Ref, computed } from '@vue/composition-api';
import { FieldTree } from './types';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Field, Relation } from '@/types';

export function findTree(tree: FieldTree[] | undefined, fieldSections: string[]): FieldTree | undefined {
	if (tree === undefined) return undefined;

	const fieldObject = tree.find((f) => f.field === fieldSections[0]);

	if (fieldObject === undefined) return undefined;
	if (fieldSections.length === 1) return fieldObject;
	return findTree(fieldObject.children, fieldSections.slice(1));
}

export function filterTree(
	tree: FieldTree[] | undefined,
	f: (field: FieldTree, prefix: string) => boolean,
	prefix = ''
) {
	if (tree === undefined) return undefined;

	const newTree: FieldTree[] = [];
	tree.forEach((field) => {
		if (f(field, prefix)) {
			newTree.push({
				field: field.field,
				name: field.name,
				children: filterTree(field.children, f, prefix + field.field + '.'),
			});
		}
	});
	return newTree.length === 0 ? undefined : newTree;
}

export default function useFieldTree(collection: Ref<string>, showHidden = false) {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const tree = computed<FieldTree[]>(() => {
		return fieldsStore
			.getFieldsForCollection(collection.value)
			.filter(
				(field: Field) =>
					showHidden ||
					(field.meta?.hidden === false && (field.meta?.special || []).includes('alias') === false)
			)
			.map((field: Field) => parseField(field, []));

		function parseField(field: Field, parents: Field[]) {
			const fieldInfo: FieldTree = {
				field: field.field,
				name: field.name,
			};

			if (parents.length === 2) {
				return fieldInfo;
			}

			const relations = relationsStore.getRelationsForField(field.collection, field.field);

			if (relations.length > 0) {
				const relatedFields = relations
					.map((relation: Relation) => {
						const relatedCollection =
							relation.many_collection === field.collection
								? relation.one_collection
								: relation.many_collection;

						if (relation.junction_field === field.field) return [];

						return fieldsStore
							.getFieldsForCollection(relatedCollection)
							.filter(
								(field: Field) =>
									field.meta?.hidden === false &&
									(field.meta?.special || []).includes('alias') === false
							);
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
