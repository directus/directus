import { Ref, ref } from 'vue';
import { get, isEqual } from 'lodash';
import { RelationInfo } from '@/composables/use-relation-info';

type UsableEdit = {
	currentlyEditing: Ref<string | number | null>;
	editItem: (item: any) => void;
	editsAtStart: Ref<Record<string, any>>;
	stageEdits: (edits: any) => void;
	cancelEdit: () => void;
	relatedPrimaryKey: Ref<string | number | null>;
	editModalActive: Ref<boolean>;
};

export default function useEdit(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	relationInfo: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void
): UsableEdit {
	const editModalActive = ref(false);
	const currentlyEditing = ref<string | number | null>(null);
	const relatedPrimaryKey = ref<string | number | null>(null);

	// This keeps track of the starting values so we can match with it
	const editsAtStart = ref<Record<string, any>>({});

	function editItem(item: any) {
		const { relation, relatedField, junction } = relationInfo.value;

		if (!relation || !junction) return;

		editModalActive.value = true;
		editsAtStart.value = item;
		currentlyEditing.value = get(item, [junction.primaryKey.field], null);
		relatedPrimaryKey.value = get(item, [relatedField, relation.primaryKey.field], null);
	}

	function stageEdits(edits: any) {
		const { relation, relatedField, junction } = relationInfo.value;

		if (!relation || !junction) return null;

		const newValue = (value.value || []).map((item) => {
			if (currentlyEditing.value !== null) {
				const id = currentlyEditing.value;

				if (typeof item === 'object' && junction.primaryKey.field in item) {
					if (item[junction.primaryKey.field] === id) return edits;
				} else if (['number', 'string'].includes(typeof item)) {
					if (item === id) return edits;
				}
			}

			if (relatedPrimaryKey.value != null) {
				const id = relatedPrimaryKey.value;

				if (get(item, [relatedField], null) === id) return edits;
				if (get(item, [relatedField, relation.primaryKey.field], null) === id) return edits;
			}

			if (isEqual(editsAtStart.value, item)) {
				return edits;
			}

			return item;
		});

		if (relatedPrimaryKey.value === null && currentlyEditing.value === null && newValue.includes(edits) === false) {
			newValue.push(edits);
		}

		if (newValue.length === 0) emit(null);
		else emit(newValue);

		cancelEdit();
	}

	function cancelEdit() {
		editModalActive.value = false;
		editsAtStart.value = {};
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
	}

	return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit, relatedPrimaryKey, editModalActive };
}
