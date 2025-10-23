import type { Ref } from 'vue';
import type { ComparisonContext } from '@/components/v-form/types';
import type { DisplayItem } from '@/composables/use-relation-multiple';

export function useGranularIndicator(
	comparison: Ref<ComparisonContext | undefined>,
	field: Ref<string>,
	relationInfo: Ref<any>,
) {
	function itemHasChanges(
		item: DisplayItem,
		options?: {
			pkFieldAccessor?: (item: DisplayItem) => any;
		},
	): boolean {
		if (!relationInfo.value || !comparison.value?.relationalDetails) return false;

		const changedIds = comparison.value.relationalDetails[field.value];
		if (!changedIds || changedIds.length === 0) return false;

		// Handle created/deleted items
		if (item.$type === 'created' || item.$type === 'deleted') {
			return true;
		}

		// Use custom accessor if provided, otherwise use default junction PK field
		const itemId = options?.pkFieldAccessor
			? options.pkFieldAccessor(item)
			: item[relationInfo.value.junctionPrimaryKeyField.field];

		if (itemId === undefined) return false;

		return changedIds.some((id) => id == itemId || String(id) === String(itemId));
	}

	return { itemHasChanges };
}
