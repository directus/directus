import { onMounted, onUnmounted, Ref } from '@vue/composition-api';
import Vue from 'vue';
import Mousetrap from 'mousetrap';

const mousetrap = new Mousetrap();

export default function useShortcut(
	shortcut: string | string[],
	handler: (evt?: ExtendedKeyboardEvent, combo?: string) => void,
	reference: Ref<HTMLElement | null> | Ref<Vue | null>
) {
	onMounted(() => {
		mousetrap.bind(shortcut, (e, combo) => {
			if (reference.value === null) return;
			const ref = reference.value instanceof HTMLElement ? reference.value : (reference.value.$el as HTMLElement);

			if (
				document.activeElement === ref ||
				ref.contains(document.activeElement) ||
				document.activeElement === document.body
			) {
				e.preventDefault();
				handler(e, combo);
			}
		});
	});
	onUnmounted(() => {
		mousetrap.unbind(shortcut);
	});
}
