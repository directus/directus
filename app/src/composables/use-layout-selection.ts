import { Item } from '@/components/v-table/types';
import { getItemRoute } from '@/utils/get-route';
import { useSync } from '@directus/composables';
import { LayoutConfig, LayoutProps } from '@directus/extensions';
import { Field } from '@directus/types';
import { Ref } from 'vue';
import { useRouter } from 'vue-router';

export type UseLayoutClickHandlerOptions = {
	props: Pick<LayoutProps, 'selectMode' | 'selection' | 'readonly' | 'collection'>;
	emit: Parameters<LayoutConfig['setup']>[1]['emit'];
	primaryKeyField: Readonly<Ref<Field | null>>;
};

export function useLayoutSelection({ props, emit, primaryKeyField }: UseLayoutClickHandlerOptions) {
	const router = useRouter();
	const selection = useSync(props, 'selection', emit);

	return {
		selection,
		onClick,
	};

	function onClick({ item, event }: { item: Item; event: MouseEvent }) {
		console.log('onClick', item, event);
		if (props.readonly === true || !primaryKeyField.value) return;

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
