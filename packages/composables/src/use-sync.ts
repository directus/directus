import type { Ref } from 'vue';
import { computed } from 'vue';

/**
 * Composable for creating two-way binding between parent and child components.
 *
 * @deprecated Use Vue's native `defineModel()` instead. This composable is kept for backward compatibility.
 * Vue 3.4+ provides `defineModel()` which offers a more streamlined and performant way to create v-model bindings.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#definemodel} Vue's defineModel documentation
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
 * // DEPRECATED: Old way using useSync
 * export default defineComponent({
 *   props: {
 *     modelValue: String,
 *     disabled: Boolean,
 *   },
 *   emits: ['update:modelValue'],
 *   setup(props, { emit }) {
 *     const syncedValue = useSync(props, 'modelValue', emit);
 *     return { syncedValue };
 *   }
 * });
 *
 * // RECOMMENDED: New way using defineModel (Vue 3.4+)
 * <script setup lang="ts">
 * const modelValue = defineModel<string>();
 * const disabled = defineProps<{ disabled?: boolean }>();
 * </script>
 *
 * <template>
 *   <input v-model="modelValue" :disabled="disabled" />
 * </template>
 * ```
 *
 * @example
 * ```typescript
 * // DEPRECATED: Custom input component with useSync
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
 *     return { syncedValue };
 *   }
 * });
 *
 * // RECOMMENDED: Using defineModel with custom prop name
 * <script setup lang="ts">
 * const value = defineModel<string>('value', { required: true });
 * const { placeholder, type = 'text' } = defineProps<{
 *   placeholder?: string;
 *   type?: string;
 * }>();
 * </script>
 * ```
 *
 * @example
 * ```typescript
 * // DEPRECATED: Usage with complex objects using useSync
 * interface UserData {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * export default defineComponent({
 *   props: {
 *     userData: { type: Object as PropType<UserData>, required: true },
 *     isLoading: Boolean,
 *   },
 *   emits: ['update:userData'],
 *   setup(props, { emit }) {
 *     const syncedUserData = useSync(props, 'userData', emit);
 *
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
 *
 * // RECOMMENDED: Using defineModel with complex objects
 * <script setup lang="ts">
 * interface UserData {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * const userData = defineModel<UserData>('userData', { required: true });
 * const { isLoading } = defineProps<{ isLoading?: boolean }>();
 *
 * const updateName = (newName: string) => {
 *   userData.value = {
 *     ...userData.value,
 *     name: newName
 *   };
 * };
 * </script>
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
