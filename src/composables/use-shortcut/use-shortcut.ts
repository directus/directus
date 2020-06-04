import { onMounted, onUnmounted } from '@vue/composition-api';
import Mousetrap from 'mousetrap';

const mousetrap = new Mousetrap();
mousetrap.stopCallback = function (e: Event, element: Element) {
	// if the element has the class "mousetrap" then no need to stop
	if (element.hasAttribute('data-disable-mousetrap')) {
		return true;
	}

	return false;
};

export default function useShortcut(
	shortcut: string | string[],
	handler: (evt?: ExtendedKeyboardEvent, combo?: string) => void
) {
	onMounted(() => {
		mousetrap.bind(shortcut, (e, combo) => {
			e.preventDefault();
			handler(e, combo);
		});
	});
	onUnmounted(() => {
		mousetrap.unbind(shortcut);
	});
}
