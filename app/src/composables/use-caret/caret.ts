import { Ref, watch, ref, ComponentPublicInstance } from 'vue';

export function useCaret(element: Ref<ComponentPublicInstance | HTMLElement | undefined>) {
	const caretPosition = ref<number | undefined>(undefined);

	watch(
		element,
		(newElement, oldElement) => {
			if (newElement !== undefined) {
				const ref = newElement instanceof HTMLElement ? newElement : (newElement.$el as HTMLElement);
				ref.addEventListener('click', onChange);
				ref.addEventListener('keyup', onChange);
			} else {
				const ref = oldElement instanceof HTMLElement ? oldElement : (oldElement?.$el as HTMLElement);
				ref?.removeEventListener('click', onChange);
				ref?.removeEventListener('keyup', onChange);
			}
		},
		{ immediate: true }
	);

	function onChange() {
		if (element.value === undefined) return;
		const ref = element.value instanceof HTMLElement ? element.value : (element.value.$el as HTMLElement);

		if (ref instanceof HTMLTextAreaElement) {
			caretPosition.value = ref.selectionStart;
		} else {
			caretPosition.value = ref.querySelector('textarea')?.selectionStart;
		}
	}

	return { caretPosition };
}
