import { MaybeRef, ref, Ref, toRef, useTemplateRef, watch } from 'vue';

export function useFocusin(reference: string | MaybeRef<HTMLElement>, active?: Ref<boolean>) {
	const element = typeof reference === 'string' ? useTemplateRef<HTMLElement>(reference) : toRef(reference);

	const state = active ?? ref(false);

	watch(state, (active) => {
		if (active) focus();
		else blur();
	});

	function focus() {
		element.value?.dispatchEvent(new FocusEvent('focus'));

		element.value?.dispatchEvent(
			new FocusEvent('focusin', {
				bubbles: true,
			}),
		);
	}

	function blur() {
		element.value?.dispatchEvent(new FocusEvent('blur'));

		element.value?.dispatchEvent(
			new FocusEvent('focusout', {
				bubbles: true,
			}),
		);
	}

	return { active: state, focus, blur };
}
