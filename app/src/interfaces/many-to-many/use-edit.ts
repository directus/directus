import { ref, Ref } from '@vue/composition-api';
import { Field, Relation } from '@/types';
import isNew from './is-new';
import { set } from 'lodash';

type EditParam = {
	relationCurrentToJunction: Ref<Relation | undefined>;
	junctionCollectionPrimaryKeyField: Ref<Field>;
	relatedCollectionPrimaryKeyField: Ref<Field>;
	value: Ref<any[] | null>;
	onEdit: (newValue: any[] | null) => void;
};

/**
 * Everything regarding the edit experience in the detail modal. This also includes adding
 * a new item
 */
export default function useEdit({
	relationCurrentToJunction,
	junctionCollectionPrimaryKeyField,
	relatedCollectionPrimaryKeyField,
	value,
	onEdit,
}: EditParam) {
	const showDetailModal = ref(false);
	// The previously made edits when we're starting to edit the item
	const editsAtStart = ref<any>(null);
	const junctionRowPrimaryKey = ref<number | string>('+');
	const relatedRowPrimaryKey = ref<number | string>('+');
	const initialValues = ref<any>(null);

	return {
		showDetailModal,
		editsAtStart,
		addNew,
		cancelEdit,
		stageEdits,
		junctionRowPrimaryKey,
		editExisting,
		relatedRowPrimaryKey,
		initialValues,
	};

	function addNew() {
		editsAtStart.value = null;
		showDetailModal.value = true;
		junctionRowPrimaryKey.value = '+';
		relatedRowPrimaryKey.value = '+';
		initialValues.value = null;
	}

	// The row here is the item in previewItems that's passed to the table
	function editExisting(item: any) {
		if (!relationCurrentToJunction.value) return;
		if (!relationCurrentToJunction.value.junction_field) return;

		if (
			isNew(item, {
				relationCurrentToJunction,
				junctionCollectionPrimaryKeyField,
				relatedCollectionPrimaryKeyField,
			})
		) {
			editsAtStart.value = item;
			junctionRowPrimaryKey.value = '+';
			showDetailModal.value = true;
			initialValues.value = null;
			return;
		}

		initialValues.value = item;

		/**
		 * @NOTE: Keep in mind there's a case where the junction row doesn't exist yet, but
		 * the related item does (when selecting an existing item)
		 */

		const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
		const junctionField = relationCurrentToJunction.value.junction_field;
		const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

		junctionRowPrimaryKey.value = item[junctionPrimaryKey] || '+';
		relatedRowPrimaryKey.value = item[junctionField]?.[relatedPrimaryKey] || '+';
		editsAtStart.value = item['$stagedEdits'] || null;
		showDetailModal.value = true;
	}

	function cancelEdit() {
		editsAtStart.value = {};
		showDetailModal.value = false;
		junctionRowPrimaryKey.value = '+';
	}

	function stageEdits(edits: any) {
		if (!relationCurrentToJunction.value) return;
		if (!relationCurrentToJunction.value.junction_field) return;

		const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
		const junctionField = relationCurrentToJunction.value.junction_field;
		const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

		const currentValue = [...(value.value || [])];

		// If there weren't any previously made edits, it's safe to assume this change value
		// doesn't exist yet in the staged value
		if (!editsAtStart.value) {
			// If the item that we edited has any of the primary keys (junction/related), we
			// have to make sure we stage those as well. Otherwise the API will treat it as
			// a newly created item instead of updated existing
			if (junctionRowPrimaryKey.value !== '+') {
				set(edits, junctionPrimaryKey, junctionRowPrimaryKey.value);
			}

			if (relatedRowPrimaryKey.value !== '+') {
				set(edits, [junctionField, relatedPrimaryKey], relatedRowPrimaryKey.value);
			}

			onEdit([...currentValue, edits]);
			reset();
			return;
		}

		const newValue =
			value.value?.map((stagedValue: any) => {
				if (stagedValue === editsAtStart.value) return edits;
				return stagedValue;
			}) || null;

		onEdit(newValue);
		reset();

		function reset() {
			editsAtStart.value = null;
			showDetailModal.value = true;
			junctionRowPrimaryKey.value = '+';
			relatedRowPrimaryKey.value = '+';
		}
	}
}
