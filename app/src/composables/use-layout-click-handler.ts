import { Item } from '@/components/v-table/types';
import { getItemRoute } from '@/utils/get-route';
import { LayoutProps } from '@directus/extensions';
import { Field, PrimaryKey } from '@directus/types';
import { Ref } from 'vue';
import { useRouter } from 'vue-router';

export type UseLayoutClickHandlerOptions = {
	props: Pick<LayoutProps, 'selectMode' | 'readonly' | 'collection'>;
	selection: Ref<PrimaryKey[]>;
	primaryKeyField: Readonly<Ref<Field | null>>;
};

export function useLayoutClickHandler({ props, selection, primaryKeyField }: UseLayoutClickHandlerOptions) {
	const router = useRouter();

	return {
		onClick,
	};

	function onClick({ item, event }: { item: Item; event: MouseEvent }) {
		if (props.readonly === true || !primaryKeyField.value || event.defaultPrevented) return;

		const primaryKey = item[primaryKeyField.value.field];

		if (props.selectMode || selection.value?.length > 0) {
			if (selection.value?.includes(primaryKey) === false) {
				selection.value = selection.value.concat(primaryKey);
			} else {
				selection.value = selection.value.filter((item) => item !== primaryKey);
			}
		} else {
			const route = getItemRoute(props.collection, primaryKey);

			if (event.ctrlKey || event.metaKey) window.open(router.resolve(route).href, '_blank');
			else router.push(route);
		}
	}
}
