import { getLayouts } from '@/layouts';
import { computed, reactive, toRefs, defineComponent, Ref, PropType, Component, ComputedRef } from 'vue';
import { AppFilter, Item, LayoutConfig } from '@directus/shared/types';

const WRITABLE_PROPS = ['selection', 'layoutOptions', 'layoutQuery', 'filters', 'searchQuery'] as const;

type WritableProp = typeof WRITABLE_PROPS[number];

function isWritableProp(prop: string): prop is WritableProp {
	return (WRITABLE_PROPS as readonly string[]).includes(prop);
}

function createLayoutWrapper<Options, Query>(layout: LayoutConfig): Component {
	return defineComponent({
		name: layout.id,
		props: {
			collection: {
				type: String,
				required: true,
			},
			selection: {
				type: Array as PropType<Item[]>,
				default: () => [],
			},
			layoutOptions: {
				type: Object as PropType<Options>,
				default: () => ({}),
			},
			layoutQuery: {
				type: Object as PropType<Query>,
				default: () => ({}),
			},
			filters: {
				type: Array as PropType<AppFilter[]>,
				default: () => [],
			},
			searchQuery: {
				type: String as PropType<string | null>,
				default: null,
			},
			selectMode: {
				type: Boolean,
				default: false,
			},
			readonly: {
				type: Boolean,
				default: false,
			},
			resetPreset: {
				type: Function as PropType<() => Promise<void>>,
				default: null,
			},
		},
		emits: WRITABLE_PROPS.map((prop) => `update:${prop}` as const),
		setup(props, { emit }) {
			const state: Record<string, unknown> = reactive({ ...layout.setup(props, { emit }), ...toRefs(props) });

			for (const key in state) {
				state[`onUpdate:${key}`] = (value: unknown) => {
					if (isWritableProp(key)) {
						emit(`update:${key}`, value);
					} else if (!Object.keys(props).includes(key)) {
						state[key] = value;
					}
				};
			}

			return { state };
		},
		render(ctx: any) {
			return ctx.$slots.default !== undefined ? ctx.$slots.default({ layoutState: ctx.state }) : null;
		},
	});
}

export function useLayout<Options = any, Query = any>(
	layoutId: Ref<string | null>
): { layoutWrapper: ComputedRef<Component> } {
	const { layouts } = getLayouts();

	const layoutWrappers = computed(() => layouts.value.map((layout) => createLayoutWrapper<Options, Query>(layout)));

	const layoutWrapper = computed(() => {
		const layout = layoutWrappers.value.find((layout) => layout.name === layoutId.value);

		if (layout === undefined) {
			return layoutWrappers.value.find((layout) => layout.name === 'tabular')!;
		}

		return layout;
	});

	return { layoutWrapper };
}
