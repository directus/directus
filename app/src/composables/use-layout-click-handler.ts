import { LayoutProps } from '@directus/extensions';
import { Field, PrimaryKey } from '@directus/types';
import { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { Item } from '@/components/v-table/types';
import { useShiftSelection } from '@/composables/use-shift-selection';
import { getItemRoute } from '@/utils/get-route';

export type UseLayoutClickHandlerOptions = {
	props: Pick<LayoutProps, 'selectMode' | 'readonly' | 'collection'>;
	items: Ref<Item[]>;
	selection: Ref<PrimaryKey[]>;
	primaryKeyField: Readonly<Ref<Field | null>>;
};

const shiftSelection = useShiftSelection();

export function useLayoutClickHandler({ props, items, selection, primaryKeyField }: UseLayoutClickHandlerOptions) {
	const router = useRouter();

	return {
		onClick,
	};

	function onClick({ item, event }: { item: Item; event: MouseEvent }) {
		if (props.readonly === true || !primaryKeyField.value) return;

		const primaryKey = item[primaryKeyField.value.field];

		if (props.selectMode || selection.value?.length > 0) {
			if (items.value && primaryKeyField.value) {
				const currentIndex = items.value.findIndex((i: Item) => {
					return i[primaryKeyField.value!.field] === item[primaryKeyField.value!.field];
				});

				const shiftFlag = event.shiftKey;

				const selectionMask: boolean[] = items.value.map((item: Item) => {
					for (const key of selection.value) {
						if (item[primaryKeyField.value!.field] === key) {
							return true;
						}
					}

					return false;
				});

				if (shiftFlag) {
					const newSelectionMask = shiftSelection.updateSelection(selectionMask, currentIndex);

					selection.value = items.value
						.filter((_item: Item, index: number) => newSelectionMask[index])
						.map((i: Item) => i[primaryKeyField.value!.field]);
				} else {
					if (selection.value?.includes(primaryKey) === false) {
						selection.value = selection.value.concat(primaryKey);
					} else {
						selection.value = selection.value.filter((item) => item !== primaryKey);
					}
				}
			} else {
				if (selection.value?.includes(primaryKey) === false) {
					selection.value = selection.value.concat(primaryKey);
				} else {
					selection.value = selection.value.filter((item) => item !== primaryKey);
				}
			}
		} else {
			const route = getItemRoute(props.collection, primaryKey);

			if (event.ctrlKey || event.metaKey) window.open(router.resolve(route).href, '_blank');
			else router.push(route);
		}
	}
}
