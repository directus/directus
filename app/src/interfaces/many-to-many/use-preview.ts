import { Ref, ref, watch } from '@vue/composition-api';
import api from '@/api';
import { Field, Relation } from '@/types';
import { merge } from 'lodash';
import adjustFieldsForDisplay from '@/utils/adjust-fields-for-displays';
import isNew from './is-new';

/**
 * Controls what preview is shown in the table. Has some black magic logic to ensure we're able
 * to show the latest edits, while also maintaining a clean staged value set. This is not responsible
 * for setting or modifying any data. Preview items should be considered read only
 */

type PreviewParam = {
	value: Ref<any[] | null>;
	primaryKey: Ref<string | number>;
	junctionCollectionPrimaryKeyField: Ref<Field>;
	relatedCollectionPrimaryKeyField: Ref<Field>;
	junctionCollection: Ref<string>;
	relatedCollection: Ref<string>;
	relationCurrentToJunction: Ref<Relation | undefined>;
	relationJunctionToRelated: Ref<Relation | null | undefined>;
	fields: Ref<readonly string[]>;
};

export default function usePreview({
	value,
	primaryKey,
	junctionCollectionPrimaryKeyField,
	relatedCollectionPrimaryKeyField,
	relationCurrentToJunction,
	relationJunctionToRelated,
	junctionCollection,
	relatedCollection,
	fields,
}: PreviewParam) {
	const loading = ref(false);
	const previewItems = ref<readonly any[]>([]);
	const error = ref(null);

	// Every time the value changes, we'll reset the preview values. This ensures that we'll
	// almost show the most up to date information in the preview table, regardless of if this
	// is the first load or a subsequent edit.
	watch(value, setPreview, { immediate: true });

	return { loading, previewItems, error };

	async function setPreview() {
		loading.value = true;

		try {
			const existingItems = await fetchExisting();
			const updatedExistingItems = applyUpdatesToExisting(existingItems);
			const newlyAddedItems = getNewlyAdded();
			const newlySelectedItems = await fetchNewlySelectedItems();
			previewItems.value = [...updatedExistingItems, ...newlyAddedItems, ...newlySelectedItems].filter(
				(stagedEdit: any) => !stagedEdit['$delete']
			);
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	/**
	 * Looks through props.value and applies all staged changes to the existing selected
	 * items. The array of existing items is an array of junction rows, so we can assume
	 * those have a primary key
	 */
	function applyUpdatesToExisting(existing: any[]) {
		return existing.map((existingValue) => {
			const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
			const existingPrimaryKey = existingValue[junctionPrimaryKey];

			const stagedEdits: any = (value.value || []).find((update: any) => {
				const updatePrimaryKey = update[junctionPrimaryKey];
				return existingPrimaryKey === updatePrimaryKey;
			});

			if (stagedEdits === undefined) return existingValue;

			return {
				...merge(existingValue, stagedEdits),
				$stagedEdits: stagedEdits,
			};
		});
	}

	/**
	 * To get the currently selected items, we'll fetch the rows from the junction table
	 * where the field back to the current collection is equal to the primary key. We go
	 * this route as it's more performant than trying to go an extra level deep in the
	 * current item.
	 */
	async function fetchExisting() {
		if (!relationCurrentToJunction.value) return;
		if (!relationCurrentToJunction.value.junction_field) return;
		if (!relationJunctionToRelated.value) return;
		if (!relationJunctionToRelated.value.junction_field) return;

		// If the current item is being created, we don't have to search for existing relations
		// yet, as they can't have been saved yet.
		if (primaryKey.value === '+') return [];

		const junctionTable = relationCurrentToJunction.value.many_collection;

		// The stuff we want to fetch is the related junction row, and the content of the
		// deeply related item nested. This should match the value that's set in the fields
		// option. We have to make sure we're fetching the primary key of both the junction
		// as the related item though, as that makes sure we're able to update the item later,
		// instead of adding a new one in the API.
		const fieldsToFetch = [...fields.value];

		// The following will add the PK and related items PK to the request fields, like
		// "id" and "related.id"
		const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
		const junctionField = relationCurrentToJunction.value.junction_field;
		const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;
		const currentInJunction = relationJunctionToRelated.value.junction_field;

		if (fieldsToFetch.includes(junctionPrimaryKey) === false) fieldsToFetch.push(junctionPrimaryKey);
		if (fieldsToFetch.includes(`${junctionField}.${relatedPrimaryKey}`) === false)
			fieldsToFetch.push(`${junctionField}.${relatedPrimaryKey}`);

		const response = await api.get(`/items/${junctionTable}`, {
			params: {
				fields: adjustFieldsForDisplay(fieldsToFetch, junctionCollection.value),
				[`filter[${currentInJunction}][_eq]`]: primaryKey.value,
			},
		});

		return response.data.data;
	}

	/**
	 * Extract the newly created rows from props.value. Values that don't have a junction row
	 * primary key and no primary key in the related item are created "totally" new and should
	 * be added to the array of previews as is.
	 * NOTE: This does not included items where the junction row is new, but the related item
	 * isn't.
	 */
	function getNewlyAdded() {
		if (!relationCurrentToJunction.value) return [];
		if (!relationCurrentToJunction.value.junction_field) return [];

		/**
		 * @NOTE There's an interesting case here:
		 *
		 * If you create both a new junction row _and_ a new related row, any selected existing
		 * many to one record won't have it's data object staged, as it already exists (so it's just)
		 * the primary key. This will case a template display to show ???, as it only gets the
		 * primary key. If you saw an issue about that on GitHub, this is where to find it.
		 *
		 * Unlike in fetchNewlySelectedItems(), we can't just fetch the related item, as both
		 * junction and related are new. We _could_ traverse through the object of changes, see
		 * if there's any relational field, and fetch the data based on that combined with the
		 * fields adjusted for the display. While that should work, it's too much of an edge case
		 * for me for now to worry about..
		 */

		return (value.value || [])
			.filter((stagedEdit: any) => !stagedEdit['$delete'])
			.filter((item) =>
				isNew(item, {
					relationCurrentToJunction,
					junctionCollectionPrimaryKeyField,
					relatedCollectionPrimaryKeyField,
				})
			);
	}

	/**
	 * The tricky case where the user selects an existing item from the related collection
	 * This means the junction doesn't have a primary key yet, and the only value that is
	 * staged is the related item's primary key
	 * In this function, we'll fetch the full existing item from the related collection,
	 * so we can still show it's data in the preview table
	 */
	async function fetchNewlySelectedItems() {
		if (!relationCurrentToJunction.value) return [];
		if (!relationCurrentToJunction.value.junction_field) return [];
		if (!relationJunctionToRelated.value) return [];
		if (!relationJunctionToRelated.value.junction_field) return [];

		const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
		const junctionField = relationCurrentToJunction.value.junction_field;
		const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

		const newlySelectedStagedItems = (value.value || [])
			.filter((stagedEdit: any) => !stagedEdit['$delete'])
			.filter((stagedEdit: any) => {
				return (
					stagedEdit[junctionPrimaryKey] === undefined &&
					stagedEdit[junctionField]?.[relatedPrimaryKey] !== undefined
				);
			});

		const newlySelectedRelatedKeys = newlySelectedStagedItems.map(
			(stagedEdit: any) => stagedEdit[junctionField][relatedPrimaryKey]
		);

		// If there's no newly selected related items, we can return here, as there's nothing
		// to fetch
		if (newlySelectedRelatedKeys.length === 0) return [];

		// The fields option are set from the viewport of the junction table. Seeing we only
		// fetch from the related table, we have to filter out all the fields from the junction
		// table and remove the junction field prefix from the related table columns
		const fieldsToFetch = fields.value
			.filter((field) => field.startsWith(junctionField))
			.map((relatedField) => {
				return relatedField.replace(junctionField + '.', '');
			});

		if (fieldsToFetch.includes(relatedPrimaryKey) === false) fieldsToFetch.push(relatedPrimaryKey);

		const endpoint = relatedCollection.value.startsWith('directus_')
			? `/${relatedCollection.value.substring(9)}/${newlySelectedRelatedKeys.join(',')}`
			: `/items/${relatedCollection.value}/${newlySelectedRelatedKeys.join(',')}`;

		const response = await api.get(endpoint, {
			params: {
				fields: adjustFieldsForDisplay(fieldsToFetch, junctionCollection.value),
			},
		});

		const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];

		return newlySelectedStagedItems.map((stagedEdit: any) => {
			const pk = stagedEdit[junctionField][relatedPrimaryKey];

			const relatedItem = data.find((relatedItem: any) => relatedItem[relatedPrimaryKey] === pk);

			return merge(
				{
					[junctionField]: relatedItem,
					$stagedEdits: stagedEdit,
				},
				stagedEdit
			);
		});
	}
}
