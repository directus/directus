import { getLayouts } from '@/layouts';
import { LayoutProps } from '@/layouts/types';
import { computed, reactive, provide, inject, Ref, UnwrapRef } from 'vue';

type LayoutState<T, Options, Query> = {
	props: LayoutProps<Options, Query>;
} & T;

const layoutSymbol = Symbol();

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

	provide(layoutSymbol, layoutState);
	return layoutState;
}

export function useLayoutState<T extends Record<string, any> = Record<string, any>, Options = any, Query = any>(): Ref<
	UnwrapRef<LayoutState<Record<string, any>, Options, Query>>
> {
	const layoutState = inject<Ref<UnwrapRef<LayoutState<T, Options, Query>>>>(layoutSymbol);
	return layoutState!;
}
