import { onMounted, onUnmounted, Ref, ref } from '@vue/composition-api';
import Vue from 'vue';

type ShortcutHandler = (event: KeyboardEvent, cancelNext: () => void) => void | any | boolean;

const keysdown: Set<string> = new Set([]);
const handlers: Record<string, ShortcutHandler[]> = {};

document.body.addEventListener('keydown', (event: KeyboardEvent) => {
	if (event.repeat || !event.key) return;

	keysdown.add(mapKeys(event));
	callHandlers(event);
});

document.body.addEventListener('keyup', (event: KeyboardEvent) => {
	if (event.repeat || !event.key) return;
	keysdown.clear();
});

export default function useShortcut(
	shortcuts: string | string[],
	handler: ShortcutHandler,
	reference: Ref<HTMLElement | undefined> | Ref<Vue | undefined> = ref(document.body)
): void {
	const callback: ShortcutHandler = (event, cancelNext) => {
		if (!reference.value) return;
		const ref = reference.value instanceof HTMLElement ? reference.value : (reference.value.$el as HTMLElement);

		if (
			document.activeElement === ref ||
			ref.contains(document.activeElement) ||
			document.activeElement === document.body
		) {
			event.preventDefault();
			return handler(event, cancelNext);
		}

		return false;
	};

	onMounted(() => {
		[shortcuts].flat().forEach((shortcut) => {
			if (handlers.hasOwnProperty(shortcut)) {
				handlers[shortcut].unshift(callback);
			} else {
				handlers[shortcut] = [callback];
			}
		});
	});

	onUnmounted(() => {
		[shortcuts].flat().forEach((shortcut) => {
			if (handlers.hasOwnProperty(shortcut)) {
				handlers[shortcut] = handlers[shortcut].filter((f) => f !== callback);

				if (handlers[shortcut].length === 0) {
					delete handlers[shortcut];
				}
			}
		});
	});
}

function mapKeys(key: KeyboardEvent) {
	const map: Record<string, string> = {
		Control: 'meta',
		Command: 'meta',
	};
	const isLatinAlphabet = /^[a-zA-Z0-9]*?$/g;

	let keyString = key.key.match(isLatinAlphabet) === null ? key.code.replace(/(Key|Digit)/g, '') : key.key;

	keyString = map.hasOwnProperty(keyString) ? map[keyString] : keyString;
	keyString = keyString.toLowerCase();

	return keyString;
}

function callHandlers(event: KeyboardEvent) {
	Object.entries(handlers).forEach(([key, value]) => {
		const keys = key.split('+');

		for (key of keysdown) {
			if (keys.includes(key) === false) return;
		}

		for (key of keys) {
			if (keysdown.has(key) === false) return;
		}

		for (let i = 0; i < value.length; i++) {
			let cancel = false;

			value[i](event, () => {
				cancel = true;
			});

			// if cancelNext is called, discontinue going through the queue.
			if (typeof cancel === 'boolean' && cancel) break;
		}
	});
}
