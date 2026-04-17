import { inject, provide, ref, type Ref } from 'vue';

const headerBarInlineKey = Symbol('headerBarInline');

export function useProvideHeaderBarInline(value: Ref<boolean | undefined>) {
	provide(headerBarInlineKey, value);
}

/**
 * Indicates whether the header bar is displayed inline (within the drawer) or in its default position.
 */
export function useInjectHeaderBarInline() {
	return inject(headerBarInlineKey, ref(false));
}
