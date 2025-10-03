import type { ComputedRef } from 'vue';
import { computed } from 'vue';

/**
 * Vue props definition for size-related boolean properties.
 *
 * This object defines the standard size props that can be used in Vue components
 * to control size-based styling through CSS classes.
 *
 * @example
 * ```typescript
 * // In a Vue component
 * export default defineComponent({
 *   props: {
 *     ...sizeProps,
 *     // other props
 *   },
 *   setup(props) {
 *     const sizeClass = useSizeClass(props);
 *     return { sizeClass };
 *   }
 * });
 * ```
 */
export const sizeProps = {
	xSmall: {
		type: Boolean,
		default: false,
	},
	small: {
		type: Boolean,
		default: false,
	},
	large: {
		type: Boolean,
		default: false,
	},
	xLarge: {
		type: Boolean,
		default: false,
	},
};

interface SizeProps {
	xSmall?: boolean;
	small?: boolean;
	large?: boolean;
	xLarge?: boolean;
}

/**
 * Composable for generating CSS size class names based on size props.
 *
 * This composable takes props containing size boolean flags and returns a computed
 * CSS class name string. It follows a priority order: xSmall > small > large > xLarge.
 * If no size props are true, it returns null.
 *
 * @template T - The type of additional props that extend SizeProps
 * @param props - The props object containing size boolean properties
 * @returns A computed ref that resolves to the appropriate CSS class name or null
 *
 * @example
 * ```typescript
 * // Basic usage in a Vue component
 * const props = { small: true, large: false };
 * const sizeClass = useSizeClass(props);
 * console.log(sizeClass.value); // 'small'
 * ```
 *
 * @example
 * ```typescript
 * // Usage with additional props
 * interface MyProps {
 *   color: string;
 *   disabled: boolean;
 * }
 *
 * const props: MyProps & SizeProps = {
 *   color: 'blue',
 *   disabled: false,
 *   xLarge: true
 * };
 *
 * const sizeClass = useSizeClass(props);
 * console.log(sizeClass.value); // 'x-large'
 * ```
 *
 * @example
 * ```typescript
 * // In a Vue component with reactive props
 * export default defineComponent({
 *   props: {
 *     ...sizeProps,
 *     label: String,
 *   },
 *   setup(props) {
 *     const sizeClass = useSizeClass(props);
 *
 *     return { sizeClass };
 *   },
 *   template: `
 *     <button :class="['btn', sizeClass]">
 *       {{ label }}
 *     </button>
 *   `
 * });
 * ```
 */
export function useSizeClass<T>(props: T & SizeProps): ComputedRef<string | null> {
	const sizeClass = computed<string | null>(() => {
		if (props.xSmall) return 'x-small';
		if (props.small) return 'small';
		if (props.large) return 'large';
		if (props.xLarge) return 'x-large';
		return null;
	});

	return sizeClass;
}
