import { getLayouts } from '@/layouts';
import { LayoutProps } from '@/layouts/types';
import { computed, reactive, provide, inject, Ref } from 'vue';

const layoutSymbol = Symbol();

export function useLayout(layoutName: Ref<string>, props: LayoutProps): any {
	const { layouts } = getLayouts();

	const setupLayouts: Record<string, any> = layouts.value.reduce(
		(acc, { id, setup }) => ({ ...acc, [id]: setup(props) }),
		{}
	);

	const layoutState = computed(() => {
		const setupResult = setupLayouts[layoutName.value];

		return reactive({ ...setupResult, props });
	});

	provide(layoutSymbol, layoutState);
	return layoutState;
}

export function useLayoutState(): any {
	const layoutState = inject(layoutSymbol);
	return layoutState;
}
