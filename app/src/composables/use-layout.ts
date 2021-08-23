import { getLayouts } from '@/layouts';
import { computed, reactive, provide, Ref, UnwrapRef } from 'vue';
import { LayoutProps, LayoutState } from '@directus/shared/types';
import { LAYOUT_SYMBOL } from '@directus/shared/constants';

export function useLayout<Options = any, Query = any>(
	layoutName: Ref<string>,
	props: LayoutProps<Options, Query>
): Ref<UnwrapRef<LayoutState<Record<string, any>, Options, Query>>> {
	const { layouts } = getLayouts();

	const setupLayouts: Record<string, Record<string, any>> = layouts.value.reduce(
		(acc, { id, setup }) => ({ ...acc, [id]: setup(props) }),
		{}
	);

	const layoutState = computed(() => {
		const setupResult = setupLayouts[layoutName.value];

		return reactive<LayoutState<Record<string, any>, Options, Query>>({ ...setupResult, props });
	});

	provide(LAYOUT_SYMBOL, layoutState);

	return layoutState;
}
