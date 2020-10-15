import { Ref, ref } from '@vue/composition-api';
import { RelationInfo } from './use-relation';
import { isEqual } from 'lodash';

export default function useEdit(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	items: Ref<Record<string, any>[]>,
	relation: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void,
	getJunctionFromRelatedId: (id: string | number, items: Record<string, any>[]) => Record<string, any> | null
) {
	// Primary key of the item we're currently editing. If null, the edit modal should be
	// closed
	const currentlyEditing = ref<string | number | null>(null);

	// This keeps track of the starting values so we can match with it
	const editsAtStart = ref<Record<string, any>>({});

	function editItem(item: any) {
		const { relationPkField } = relation.value;
		const hasPrimaryKey = relationPkField in item;

		editsAtStart.value = item;
		currentlyEditing.value = hasPrimaryKey ? item[relationPkField] : -1;
	}

	function stageEdits(edits: any) {
		const { relationPkField, junctionRelation, junctionPkField } = relation.value;
		const editsWrapped = { [junctionRelation]: edits };
		const hasPrimaryKey = relationPkField in editsAtStart.value;
		const junctionItem = hasPrimaryKey
			? getJunctionFromRelatedId(editsAtStart.value[relationPkField], items.value)
			: null;

		const newValue = (value.value || []).map((item) => {
			if (junctionItem !== null && junctionPkField in junctionItem) {
				const id = junctionItem[junctionPkField];

				if (typeof item === 'object' && junctionPkField in item) {
					if (item[junctionPkField] === id) return { [junctionRelation]: edits, [junctionPkField]: id };
				} else if (typeof item === 'number' || typeof item === 'string') {
					if (item === id) return { [junctionRelation]: edits, [junctionPkField]: id };
				}
			}

			if (typeof item === 'object' && relationPkField in edits && junctionRelation in item) {
				const id = edits[relationPkField];
				const relatedItem = item[junctionRelation] as string | number | Record<string, any>;
				if (typeof relatedItem === 'object' && relationPkField in relatedItem) {
					if (relatedItem[relationPkField] === id) return editsWrapped;
				} else if (typeof relatedItem === 'string' || typeof relatedItem === 'number') {
					if (relatedItem === id) return editsWrapped;
				}
			}

			if (isEqual({ [junctionRelation]: editsAtStart.value }, item)) {
				return editsWrapped;
			}

			return item;
		});

		if (hasPrimaryKey === false && newValue.includes(editsWrapped) === false) {
			newValue.push(editsWrapped);
		}

		if (newValue.length === 0) emit(null);
		else emit(newValue);
	}

	function cancelEdit() {
		editsAtStart.value = {};
		currentlyEditing.value = null;
	}

	return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };
}
