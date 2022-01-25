import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Field, Relation } from '@directus/shared/types';
import { getRelationType } from '@directus/shared/utils';
import { Ref, ref, watch } from 'vue';

export type FieldNode = {
	name: string;
	field: string;
	collection: string;
	relatedCollection?: string;
	key: string;
	children?: FieldNode[];
};

export type FieldTreeContext = {
	treeList: Ref<FieldNode[]>;
	loadFieldRelations: (fieldPath: string, root?: FieldNode) => void;
};

export function useFieldTree(
	collection: Ref<string | null>,
	inject?: Ref<{ fields: Field[]; relations: Relation[] } | null>,
	filter: (field: Field) => boolean = () => true
): FieldTreeContext {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const treeList = ref<FieldNode[]>([]);
	const visitedPaths = ref<Set<string>>(new Set());

	watch(() => collection.value, refresh, { immediate: true });

	return { treeList, loadFieldRelations };

	function refresh(collection?: string | null) {
		visitedPaths.value = new Set();
		treeList.value = getTree(collection) ?? [];
		for (const node of treeList.value) {
			node.children = getTree(node.relatedCollection, node);
		}
	}

	function getTree(collection?: string | null, parent?: FieldNode) {
		const injectedFields = inject?.value?.fields.filter((field) => field.collection === collection);
		const fields = fieldsStore
			.getFieldsForCollectionSorted(collection!)
			.concat(injectedFields || [])
			.filter((field) => !field.meta?.special?.includes('alias') && !field.meta?.special?.includes('no-data'))
			.filter(filter)
			.flatMap((field) => makeNode(field, parent));

		return fields.length ? fields : undefined;
	}

	function makeNode(field: Field, parent?: FieldNode): FieldNode | FieldNode[] {
		const relatedCollections = getRelatedCollections(field);
		const context = parent ? parent.key + '.' : '';

		if (relatedCollections.length <= 1) {
			return {
				name: field.name,
				field: field.field,
				collection: field.collection,
				relatedCollection: relatedCollections[0],
				key: context + field.field,
			};
		}
		return relatedCollections.map((collection) => {
			return {
				name: `${field.name} (${collection})`,
				field: `${field.field}:${collection}`,
				collection: field.collection,
				relatedCollection: collection,
				key: context + `${field.field}:${collection}`,
			};
		});
	}

	function getRelatedCollections(field: Field): string[] {
		const relation = getRelationForField(field);
		if (!relation?.meta) return [];
		const relationType = getRelationType({ relation, collection: field.collection, field: field.field });
		switch (relationType) {
			case 'o2m':
				return [relation!.meta!.many_collection];
			case 'm2o':
				return [relation!.meta!.one_collection];
			case 'm2a':
				return relation!.meta!.one_allowed_collections!;
			default:
				return [];
		}
	}

	function getRelationForField(field: { collection: string; field: string }) {
		const relations = [
			...relationsStore.getRelationsForField(field.collection, field.field),
			...(inject?.value?.relations || []),
		];
		return relations.find(
			(relation: Relation) =>
				(relation.collection === field.collection && relation.field === field.field) ||
				(relation.related_collection === field.collection && relation.meta?.one_field === field.field)
		);
	}

	function getNodeAtPath([field, ...path]: string[], root?: FieldNode[]): FieldNode | undefined {
		for (const node of root || []) {
			if (node.field === field) {
				if (path.length) {
					return getNodeAtPath(path, node.children);
				} else {
					return node;
				}
			}
		}
	}

	function loadFieldRelations(path: string) {
		if (!visitedPaths.value.has(path)) {
			visitedPaths.value.add(path);
			const node = getNodeAtPath(path.split('.'), treeList.value);
			for (const child of node?.children || []) {
				child.children = getTree(child.relatedCollection, child);
			}
		}
	}
}
