import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Field, Relation } from '@directus/shared/types';
import { getRelationType } from '@directus/shared/utils';
import { get, set } from 'lodash';
import { computed, Ref, ref, ComputedRef } from 'vue';

export type FieldTree = Record<string, FieldInfo>;
export type FieldInfo = { name: string; field: string; children: FieldTree; collection: string; type: string };
export type FieldOption = { name: string; field: string; key: string; children?: FieldOption[] };

export type FieldTreeContext = {
	tree: Ref<FieldTree>;
	treeList: ComputedRef<FieldOption[]>;
	loadFieldRelations: (fieldPath: string, depth?: number) => void;
	getField: (fieldPath: string) => FieldOption | undefined;
	treeToList: (tree: FieldTree, parentName?: string) => FieldOption[];
	visitedRelations: Ref<string[][]>;
};

export function useFieldTree(
	collection: Ref<string | null>,
	inject?: Ref<{ fields: Field[]; relations: Relation[] } | null>,
	filter: (field: Field) => boolean = () => true
): FieldTreeContext {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const tree = ref<FieldTree>({});

	if (collection.value) {
		tree.value = getFieldTreeForCollection(collection.value, 'any');
	}

	const visitedRelations = ref<string[][]>([]);

	Object.values(tree.value).forEach((value) => {
		loadFieldRelations(value.field);
	});

	const treeList = computed(() => treeToList(tree.value));

	return { tree, treeList, loadFieldRelations, getField, treeToList, visitedRelations };

	function treeToList(tree: FieldTree, parentName?: string): FieldOption[] {
		return Object.values(tree).map((field) => {
			const fieldName = field.type === 'm2a' ? `${field.field}:${field.collection}` : field.field;
			const key = parentName ? `${parentName}.${fieldName}` : fieldName;
			const children = treeToList(field.children, key);
			return {
				name: field.name,
				key,
				field: fieldName,
				children: children.length > 0 ? children : undefined,
				selectable: true,
			};
		});
	}

	function getFieldTreeForCollection(collection: string, type: string) {
		const fields = [
			...fieldsStore.getFieldsForCollection(collection),
			...(inject?.value?.fields.filter((field) => field.collection === collection) || []),
		]
			.filter((field: Field) => {
				const shown =
					field.meta?.special?.includes('alias') !== true && field.meta?.special?.includes('no-data') !== true;
				return shown;
			})
			.filter(filter);

		return fields.reduce((acc, field) => {
			if (type === 'm2a') {
				const fieldName = `${field.field}:${collection}`;
				acc[fieldName] = {
					field: field.field,
					name: `${field.name} (${field.collection})`,
					collection: field.collection,
					type,
					children: {},
				};
			} else {
				acc[field.field] = {
					field: field.field,
					name: field.name,
					collection: field.collection,
					type,
					children: {},
				};
			}

			return acc;
		}, {} as FieldTree);
	}

	function getField(fieldPath: string): FieldOption | undefined {
		const path = fieldPath.split('.');

		function getFieldRecursive(path: string[], list: FieldOption[]): FieldOption | undefined {
			const targetField = path.shift();
			const subList = list.find((el) => el.field === targetField);
			if (subList === undefined || subList.children === undefined) return undefined;
			if (path.length === 0) return subList;
			return getFieldRecursive(path, subList.children);
		}

		return getFieldRecursive(path, treeList.value);
	}

	function loadFieldRelations(fieldPath: string, depth = 0) {
		_loadFieldRelations(fieldPath);
		if (depth === 0) return;
		const field = getField(fieldPath);
		if (!field) return;

		field.children?.forEach((child) => loadFieldRelations(child.key, depth - 1));
	}

	function _loadFieldRelations(fieldPath: string) {
		const path = fieldPath.replaceAll('.', '.children.');
		const field = get(tree.value, path) as FieldInfo | undefined;
		if (field === undefined || Object.keys(field.children).length > 0) return;

		const relations = [
			...relationsStore.getRelationsForField(field.collection, field.field),
			...(inject?.value?.relations || []),
		];
		const relation = getRelation(relations, field.collection, field.field);

		if (relations.length === 0 || !relation || !relation.meta) return;

		if (relationVisited(relation)) return;

		const relationType = getRelationType({ relation, collection: field.collection, field: field.field });
		if (relation.meta === undefined) return;

		let children: FieldTree = {};

		if (relationType === 'o2m') {
			children = getFieldTreeForCollection(relation.meta.many_collection, relationType);
		} else if (relationType === 'm2o') {
			children = getFieldTreeForCollection(relation.meta.one_collection, relationType);
		} else if (relationType === 'm2a') {
			children =
				relation.meta.one_allowed_collections?.reduce((acc, collection) => {
					return { ...acc, ...getFieldTreeForCollection(collection, relationType) };
				}, {}) || {};
		}

		Object.values(children).forEach((child) => {
			const relation: string[] = [field.collection, field.field, child.collection, child.field];
			const exists = visitedRelations.value.findIndex((rel) => relationEquals(rel, relation)) !== -1;

			if (exists === false) visitedRelations.value.push(relation);
		});

		set(tree.value, `${path}.children`, children);
	}

	function relationVisited(relation: Relation) {
		if (!relation.meta) return;

		if (relation.meta.one_collection_field !== null && relation.meta.one_allowed_collections !== null) return false;

		const simpleRelation: string[] = [
			relation.meta.many_collection,
			relation.meta.one_collection,
			relation.meta.many_field,
			relation.meta.one_field || '',
		];

		return visitedRelations.value.find((relation) => relationEquals(simpleRelation, relation)) !== undefined;
	}

	function getRelation(relations: Relation[], collection: string, field: string) {
		return relations.find(
			(relation: Relation) =>
				(relation.collection === collection && relation.field === field) ||
				(relation.related_collection === collection && relation.meta?.one_field === field)
		);
	}

	function relationEquals(rel1: string[], rel2: string[]) {
		for (const rel of rel1) {
			if (rel2.includes(rel) === false) return false;
		}
		return true;
	}
}
