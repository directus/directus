import { assign } from 'lodash-es';
import type { Ref, UnwrapRef, WritableComputedRef } from 'vue';
import { computed, unref } from 'vue';

/**
 * Use a property of a Ref<object> as it's own ref.
 *
 * @example
 * ```js
 * const obj = ref({ example: true });
 * const example = useObjectProperty(obj, 'example');
 * // example: Ref<boolean>;
 * ```
 */
export const useObjectProperty = <InputRef extends Ref, Key extends keyof UnwrapRef<InputRef>>(
	obj: InputRef,
	key: Key
): WritableComputedRef<UnwrapRef<InputRef>[Key]> => {
	return computed({
		get() {
			return unref(obj)[key];
		},
		set(value) {
			const newObj = assign({}, unref(obj), { [key]: value });
			newObj[key] = value;
			obj.value = newObj;
		},
	});
};
