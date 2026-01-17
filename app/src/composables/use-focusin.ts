import { ComponentPublicInstance, computed, MaybeRef, ref, Ref, toRef, watch } from 'vue';

export function useFocusin(
	reference: MaybeRef<HTMLElement | ComponentPublicInstance | undefined | null>,
	active?: Ref<boolean>,
) {
	const element = computed(() => {
		const elRef = toRef(reference);
		if (!elRef.value) return;

		let element: HTMLElement | undefined = undefined;

		if (elRef.value instanceof HTMLElement) {
			element = elRef.value;
		} else {
			element = elRef.value?.$el;
		}

		return element;
	});

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
