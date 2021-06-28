import { inject, Ref, UnwrapRef } from 'vue';
import { LAYOUT_SYMBOL } from '../constants';
import { LayoutState } from '../types';

export function useLayoutState<T extends Record<string, any> = Record<string, any>, Options = any, Query = any>(): Ref<
	UnwrapRef<LayoutState<T, Options, Query>>
> {
	const layoutState = inject<Ref<UnwrapRef<LayoutState<T, Options, Query>>>>(LAYOUT_SYMBOL);

	if (!layoutState) throw new Error('[useLayoutState]: This function has to be used inside a layout component.');

	return layoutState;
}
