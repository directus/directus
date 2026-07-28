import { isPublishedVersionKey } from '@directus/constants';
import { LayoutProps } from '@directus/extensions';
import { Field, PrimaryKey } from '@directus/types';
import { isNil } from 'lodash';
import { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { Item } from '@/components/v-table/types';
import { getItemRoute } from '@/utils/get-route';

export type UseLayoutClickHandlerOptions = {
	props: Pick<LayoutProps, 'selectMode' | 'readonly' | 'collection'>;
	selection: Ref<PrimaryKey[]>;
	primaryKeyField: Readonly<Ref<Field | null>>;
	versionKey?: Readonly<Ref<string | null | undefined>>;
};

export function useLayoutClickHandler({ props, selection, primaryKeyField, versionKey }: UseLayoutClickHandlerOptions) {
	const router = useRouter();

	return {
		onClick,
	};

	function onClick({ item, event }: { item: Item; event: MouseEvent | KeyboardEvent }) {
		if (props.readonly === true || !primaryKeyField.value) return;

		const primaryKey = item[primaryKeyField.value.field];
		const isVersion = !!versionKey?.value && !isPublishedVersionKey(versionKey.value);
		const versionItemId: string | null = item.$meta?.version_id ?? null;
		const selectionId = isVersion ? versionItemId : primaryKey;

		if (props.selectMode || selection.value?.length > 0) {
			if (isNil(selectionId)) return;

			if (selection.value?.includes(selectionId) === false) {
				selection.value = selection.value.concat(selectionId);
			} else {
				selection.value = selection.value.filter((item) => item !== selectionId);
			}
		} else {
			const isItemless = primaryKey === null && versionItemId !== null;

			const route = getItemRoute(
				props.collection,
				isItemless ? '+' : primaryKey,
				versionKey?.value,
				isItemless ? versionItemId : undefined,
			);

			if (event.ctrlKey || event.metaKey) window.open(router.resolve(route).href, '_blank');
			else router.push(route);
		}
	}
}
