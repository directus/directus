import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { Field, Relation, Type } from '@directus/types';
import { getRelationType } from '@directus/utils';
import { isNil } from 'lodash';
import { Ref, ref, watch } from 'vue';

export type FieldNode = {
	name: string;
	field: string;
	collection: string;
	relatedCollection?: string;
	key: string;
	path: string;
	type: Type;
	children?: FieldNode[];
	group?: boolean;
	_loading?: boolean;
};

export type FieldTreeContext = {
	treeList: Ref<FieldNode[]>;
	loadFieldRelations: (fieldPath: string, root?: FieldNode) => void;
	refresh: (collection?: string) => void;
};

export function useFieldTree(
	collection: Ref<string | null>,
	inject?: Ref<{ fields: Field[]; relations: Relation[] } | null>,
	filter: (field: Field, parent?: FieldNode) => boolean = () => true
): FieldTreeContext {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const treeList = ref<FieldNode[]>([]);
	const visitedPaths = ref<Set<string>>(new Set());

	watch(() => collection.value, refresh, { immediate: true });

	return { treeList, loadFieldRelations, refresh };

	function refresh() {
		visitedPaths.value = new Set();
		treeList.value = getTree(collection.value) ?? [];

		for (const node of treeList.value) {
			if (node.relatedCollection) {
				node.children = getTree(node.relatedCollection, node);
			}
		}
	}

	function getTree(collection?: string | null, parent?: FieldNode) {
		const injectedFields = inject?.value?.fields.filter((field) => field.collection === collection);

		const allFields = fieldsStore
			.getFieldsForCollectionSorted(collection!)
			.concat(injectedFields || [])
			.filter(
				(field) =>
					field.meta?.special?.includes('group') ||
					(!field.meta?.special?.includes('alias') && !field.meta?.special?.includes('no-data'))
			)
			.filter((field) => filter(field, parent));

		const topLevelFields = allFields.filter((field) => {
			if (parent?.group === true) return field.meta?.group === parent?.field;
			return isNil(field.meta?.group);
		});

		const fieldNodes = topLevelFields.flatMap((field) => makeNode(field, parent));

		return fieldNodes.length ? fieldNodes : undefined;
	}

	function makeNode(field: Field, parent?: FieldNode): FieldNode | FieldNode[] {
		const { relationType, relatedCollections } = getRelationTypeAndRelatedCollections(field);
		const pathContext = parent?.path ? parent.path + '.' : '';
		const keyContext = parent?.key ? parent.key + '.' : '';

		if (field?.meta?.special?.includes('group')) {
			const node: FieldNode = {
				name: field.name,
				field: field.field,
				collection: field.collection,
				relatedCollection: undefined,
				key: parent ? parent.key : '',
				path: pathContext + field.field,
				group: true,
				type: field.type,
			};

			const children = getTree(field.collection, node);

			if (children) {
				for (const child of children) {
					if (child.relatedCollection) {
						child.children = [
							{ name: 'Loading...', field: '', collection: '', key: '', path: '', type: 'alias', _loading: true },
						];
					}
				}
			}

			return {
				...node,
				children,
			};
		}

		if (relatedCollections.length <= 1 && relationType !== 'm2a') {
			return {
				name: field.name,
				field: field.field,
				collection: field.collection,
				relatedCollection: relatedCollections[0],
				key: keyContext + field.field,
				path: pathContext + field.field,
				type: field.type,
			};
		}

		return relatedCollections.map((collection) => {
			return {
				name: `${field.name} (${collection})`,
				field: `${field.field}:${collection}`,
				collection: field.collection,
				relatedCollection: collection,
				key: keyContext + `${field.field}:${collection}`,
				path: pathContext + `${field.field}:${collection}`,
				type: field.type,
			};
		});
	}

	function getRelationTypeAndRelatedCollections(field: Field): {
		relationType: 'o2m' | 'm2o' | 'm2a' | null;
		relatedCollections: string[];
	} {
		const relation = getRelationForField(field);
		if (!relation?.meta) return { relationType: null, relatedCollections: [] };
		const relationType = getRelationType({ relation, collection: field.collection, field: field.field });

		switch (relationType) {
			case 'o2m':
				return { relationType: 'o2m', relatedCollections: [relation!.meta!.many_collection] };
			case 'm2o':
				return { relationType: 'm2o', relatedCollections: [relation!.meta!.one_collection!] };
			case 'm2a':
				return { relationType: 'm2a', relatedCollections: relation!.meta!.one_allowed_collections! };
			default:
				return { relationType: null, relatedCollections: [] };
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
		let node = root?.find((node) => node.field === field);

		if (!node) {
			node = root
				?.reduce<FieldNode[]>((acc, node) => {
					if (node.group === true && node.children && node.children.length > 0) {
						acc.push(...node.children);
					}

					return acc;
				}, [])
				.find((node) => node.field === field);
		}

		if (!node) return undefined;

		if (path.length) {
			return getNodeAtPath(path, node.children);
		} else {
			return node;
		}
	}

	function loadFieldRelations(path: string) {
		if (!visitedPaths.value.has(path)) {
			visitedPaths.value.add(path);

			const node = getNodeAtPath(path.split('.'), treeList.value);

			if (node && node.children?.length === 1 && node.children[0]._loading) {
				node.children = getTree(node.relatedCollection, node);
			}

			for (const child of node?.children || []) {
				if (child?.relatedCollection) {
					child.children = getTree(child.relatedCollection, child);
				}
			}
		}
	}
}
