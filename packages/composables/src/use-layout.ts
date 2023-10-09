import type { LayoutConfig, ShowSelect } from '@directus/extensions';
import type { Filter } from '@directus/types';
import type { Component, ComputedRef, PropType, Ref } from 'vue';
import { computed, defineComponent, reactive, toRefs } from 'vue';
import { useExtensions } from './use-system.js';

const NAME_SUFFIX = 'wrapper';
const WRITABLE_PROPS = ['selection', 'layoutOptions', 'layoutQuery'] as const;

type WritableProp = (typeof WRITABLE_PROPS)[number];

function isWritableProp(prop: string): prop is WritableProp {
	return (WRITABLE_PROPS as readonly string[]).includes(prop);
}

function createLayoutWrapper<Options, Query>(layout: LayoutConfig): Component {
	return defineComponent({
		name: `${layout.id}-${NAME_SUFFIX}`,
		props: {
			collection: {
				type: String,
				required: true,
			},
			selection: {
				type: Array as PropType<(number | string)[]>,
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
			layoutProps: {
				type: Object as PropType<any>,
				default: () => ({}),
			},
			filter: {
				type: Object as PropType<Filter>,
				default: null,
			},
			filterUser: {
				type: Object as PropType<Filter>,
				default: null,
			},
			filterSystem: {
				type: Object as PropType<Filter>,
				default: null,
			},
			search: {
				type: String as PropType<string | null>,
				default: null,
			},
			showSelect: {
				type: String as PropType<ShowSelect>,
				default: 'multiple',
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
			clearFilters: {
				type: Function as PropType<() => void>,
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
	const { layouts } = useExtensions();

	const layoutWrappers = computed(() => layouts.value.map((layout) => createLayoutWrapper<Options, Query>(layout)));

	const layoutWrapper = computed(() => {
		const layout = layoutWrappers.value.find((layout) => layout.name === `${layoutId.value}-${NAME_SUFFIX}`);

		if (layout === undefined) {
			return layoutWrappers.value.find((layout) => layout.name === `tabular-${NAME_SUFFIX}`)!;
		}

		return layout;
	});

	return { layoutWrapper };
}
