import { getLayouts } from '@/layouts';
import { LayoutProps } from '@/layouts/types';
import { computed, reactive, provide, inject, Ref } from 'vue';

const layoutSymbol = Symbol();

export function useLayout<T>(layoutName: Ref<string>, props: LayoutProps): T {
	const { layouts } = getLayouts();

	const currentLayout = computed(() => {
		const layout = layouts.value.find((layout) => layout.id === layoutName.value);

		if (layout === undefined) {
			return layouts.value.find((layout) => layout.id === 'tabular')!;
		}

		return layout;
	});

	const { setup } = currentLayout.value;
	const setupResult = setup(props);
	const layoutState = reactive({ ...setupResult, props });

	provide(layoutSymbol, layoutState);
	return layoutState;
}

export function useLayoutState(): any {
	const layoutState = inject(layoutSymbol);
	return layoutState;
}
