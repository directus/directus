import type { Ref } from 'vue';
import { computed } from 'vue';

/**
 * Composable for creating two-way binding between parent and child components.
 *
 * This composable creates a computed ref that synchronizes a prop value with
 * its parent component through Vue's v-model pattern. It provides a getter
 * that returns the current prop value and a setter that emits an update event
 * to notify the parent component of changes.
 *
 * This is particularly useful for creating custom form components that need
 * to work with v-model while maintaining proper data flow patterns.
 *
 * @template T - The type of the props object
 * @template K - The key of the prop to sync (must be a string key of T)
 * @template E - The emit function type with proper event typing
 *
 * @param props - The component props object containing the value to sync
 * @param key - The specific prop key to create a two-way binding for
 * @param emit - The Vue emit function for sending update events to parent
 *
 * @returns A computed ref that can be used with v-model pattern
 *
 * @example
 * ```typescript
 * // In a child component that needs v-model support
 * export default defineComponent({
 *   props: {
 *     modelValue: String,
 *     disabled: Boolean,
 *   },
 *   emits: ['update:modelValue'],
 *   setup(props, { emit }) {
 *     // Create two-way binding for modelValue prop
 *     const syncedValue = useSync(props, 'modelValue', emit);
 *
 *     return { syncedValue };
 *   },
 *   template: `
 *     <input
 *       v-model="syncedValue"
 *       :disabled="disabled"
 *     />
 *   `
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom input component with v-model support
 * interface Props {
 *   value: string;
 *   placeholder?: string;
 *   type?: string;
 * }
 *
 * export default defineComponent({
 *   props: {
 *     value: { type: String, required: true },
 *     placeholder: String,
 *     type: { type: String, default: 'text' },
 *   },
 *   emits: ['update:value'],
 *   setup(props: Props, { emit }) {
 *     const syncedValue = useSync(props, 'value', emit);
 *
 *     return { syncedValue };
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Usage with complex objects
 * interface UserData {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * interface Props {
 *   userData: UserData;
 *   isLoading: boolean;
 * }
 *
 * export default defineComponent({
 *   props: {
 *     userData: { type: Object as PropType<UserData>, required: true },
 *     isLoading: Boolean,
 *   },
 *   emits: ['update:userData'],
 *   setup(props: Props, { emit }) {
 *     const syncedUserData = useSync(props, 'userData', emit);
 *
 *     // Can be used to update the entire object
 *     const updateName = (newName: string) => {
 *       syncedUserData.value = {
 *         ...syncedUserData.value,
 *         name: newName
 *       };
 *     };
 *
 *     return { syncedUserData, updateName };
 *   }
 * });
 * ```
 */
export function useSync<T, K extends keyof T & string, E extends (event: `update:${K}`, ...args: any[]) => void>(
	props: T,
	key: K,
	emit: E,
): Ref<T[K]> {
	return computed<T[K]>({
		get() {
			return props[key];
		},
		set(newVal) {
			emit(`update:${key}` as const, newVal);
		},
	});
}
