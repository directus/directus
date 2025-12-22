import type { Filter, LayoutConfig, ShowSelect } from '@directus/types';
import type { Component, ComputedRef, PropType, Ref } from 'vue';
import { computed, defineComponent, reactive, toRefs } from 'vue';
import { useExtensions } from './use-system.js';

const NAME_SUFFIX = 'wrapper';
const WRITABLE_PROPS = ['selection', 'layoutOptions', 'layoutQuery'] as const;

type WritableProp = (typeof WRITABLE_PROPS)[number];

/**
 * Type guard to check if a property is writable (can be updated via emit).
 *
 * This function determines whether a given property name corresponds to one of the
 * writable properties that can be updated through Vue's emit system.
 *
 * @param prop - The property name to check
 * @returns True if the property is writable, false otherwise
 *
 * @example
 * ```typescript
 * if (isWritableProp('selection')) {
 *   // Property is writable, can emit update
 *   emit('update:selection', newValue);
 * }
 * ```
 */
export function isWritableProp(prop: string): prop is WritableProp {
	return (WRITABLE_PROPS as readonly string[]).includes(prop);
}

/**
 * Creates a Vue component wrapper for a layout configuration.
 *
 * This function creates a dynamic Vue component that wraps a layout with standardized
 * props, emits, and state management. It handles reactive state updates, prop validation,
 * and provides a consistent interface for all layout components.
 *
 * @template Options - The type for layout-specific options
 * @template Query - The type for layout-specific query parameters
 * @param layout - The layout configuration object containing id and setup function
 * @returns A Vue component that can be used to render the layout
 *
 * @example
 * ```typescript
 * interface MyLayoutOptions {
 *   itemSize: number;
 *   showHeaders: boolean;
 * }
 *
 * interface MyLayoutQuery {
 *   page: number;
 *   limit: number;
 * }
 *
 * const layoutConfig: LayoutConfig = {
 *   id: 'my-layout',
 *   setup: (props, { emit }) => ({
 *     // Layout-specific setup logic
 *   })
 * };
 *
 * const LayoutWrapper = createLayoutWrapper<MyLayoutOptions, MyLayoutQuery>(layoutConfig);
 * ```
 */
export function createLayoutWrapper<Options, Query>(layout: LayoutConfig): Component {
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
			const state: Record<string, unknown> = reactive({
				...layout.setup(props, { emit }),
				...toRefs(props),
				sidebarShadow: layout.sidebarShadow ?? false,
			});

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

/**
 * Composable for managing layout components in Directus.
 *
 * This composable provides access to layout components and handles the dynamic
 * selection of layout wrappers based on the provided layout ID. It automatically
 * falls back to the tabular layout if the requested layout is not found.
 *
 * @template Options - The type for layout-specific options (default: any)
 * @template Query - The type for layout-specific query parameters (default: any)
 * @param layoutId - A reactive reference to the layout ID
 * @returns An object containing the layout wrapper component
 *
 * @example
 * ```typescript
 * import { ref } from 'vue';
 * import { useLayout } from './use-layout';
 *
 * const selectedLayoutId = ref('table');
 * const { layoutWrapper } = useLayout(selectedLayoutId);
 *
 * // Use the layout wrapper in your template
 * // <component :is="layoutWrapper" :collection="'users'" />
 * ```
 *
 * @example
 * ```typescript
 * // With typed options and query
 * interface TableOptions {
 *   spacing: 'cozy' | 'comfortable' | 'compact';
 *   showHeaders: boolean;
 * }
 *
 * interface TableQuery {
 *   sort: string[];
 *   limit: number;
 * }
 *
 * const layoutId = ref<string | null>('table');
 * const { layoutWrapper } = useLayout<TableOptions, TableQuery>(layoutId);
 * ```
 */
export function useLayout<Options = any, Query = any>(
	layoutId: Ref<string | null>,
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
