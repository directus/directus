import { ComponentPublicInstance, MaybeRef, ref, Ref, toRef, watch } from 'vue';

export function useFocusin(
	reference: MaybeRef<HTMLElement | ComponentPublicInstance | undefined>,
	active?: Ref<boolean>,
) {
	const element = toRef(reference);

	const state = active ?? ref(false);

	watch(state, (active) => {
		if (active) focus();
		else blur();
	});

	function focus() {
		const el = element.value instanceof HTMLElement ? element.value : element.value?.$el;
		el?.dispatchEvent(new FocusEvent('focus'));

		el?.dispatchEvent(
			new FocusEvent('focusin', {
				bubbles: true,
			}),
		);
	}

	function blur() {
		const el = element.value instanceof HTMLElement ? element.value : element.value?.$el;
		el?.dispatchEvent(new FocusEvent('blur'));

		el?.dispatchEvent(
			new FocusEvent('focusout', {
				bubbles: true,
			}),
		);
	}

	return { active: state, focus, blur };
}
