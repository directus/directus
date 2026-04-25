import { inject, provide, ref, type Ref } from 'vue';

const headerBarInlineKey = Symbol('headerBarInline');

export function useProvideHeaderBarInline(value: Ref<boolean | undefined>) {
	provide(headerBarInlineKey, value);
}

export function useInjectHeaderBarInline() {
	return inject(headerBarInlineKey, ref(false));
}
