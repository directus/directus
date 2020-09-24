import { onMounted, onUnmounted, Ref } from '@vue/composition-api';
import Vue from 'vue';

type ShortcutHandler = (event: KeyboardEvent) => void | any | boolean;

const keysdown: Set<string> = new Set([]);
const handlers: Record<string, ShortcutHandler[]> = {};

document.body.addEventListener('keydown', (event: KeyboardEvent) => {
	if (event.repeat) return;

	keysdown.add(mapKeys(event.key));
	callHandlers(event);
});

document.body.addEventListener('keyup', (event: KeyboardEvent) => {
	const key = mapKeys(event.key);
	keysdown.delete(key.toLowerCase());
	keysdown.delete(key.toUpperCase());
});

function mapKeys(key: string) {
	const map: Record<string, string> = {
		Control: 'meta',
		Command: 'meta',
	};
	key = map.hasOwnProperty(key) ? map[key] : key;

	if (key.match(/^[a-z]$/) !== null) {
		if (keysdown.has('shift')) key = key.toUpperCase();
	} else if (key.match(/^[A-Z]$/) !== null) {
		if (keysdown.has('shift')) key = key.toLowerCase();
	} else {
		key = key.toLowerCase();
	}

	return key;
}

function callHandlers(event: KeyboardEvent) {
	Object.entries(handlers).forEach(([key, value]) => {
		const rest = key.split('+').filter((keySegment) => keysdown.has(keySegment) === false);
		if (rest.length > 0) return;
		for (let i = 0; i < value.length; i++) {
			const cancel = value[i](event);

			// if the return value is true discontinue going through the queue.
			if (typeof cancel === 'boolean' && cancel === true) break;
		}
	});
}

export default function useShortcut(
	handler: ShortcutHandler,
	reference: Ref<HTMLElement | null> | Ref<Vue | null>,
	...shortcuts: string[]
) {
	const callback: ShortcutHandler = (event) => {
		if (reference.value === null) return;
		const ref = reference.value instanceof HTMLElement ? reference.value : (reference.value.$el as HTMLElement);

		if (
			document.activeElement === ref ||
			ref.contains(document.activeElement) ||
			document.activeElement === document.body
		) {
			event.preventDefault();
			return handler(event);
		}
		return false;
	};
	onMounted(() => {
		shortcuts.forEach((shortcut) => {
			if (handlers.hasOwnProperty(shortcut)) {
				handlers[shortcut].unshift(callback);
			} else {
				handlers[shortcut] = [callback];
			}
		});
	});
	onUnmounted(() => {
		shortcuts.forEach((shortcut) => {
			if (handlers.hasOwnProperty(shortcut)) {
				handlers[shortcut] = handlers[shortcut].filter((f) => f !== callback);
				if (handlers[shortcut].length === 0) {
					delete handlers[shortcut];
				}
			}
		});
	});
}
