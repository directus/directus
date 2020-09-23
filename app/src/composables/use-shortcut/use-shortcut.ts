import { onMounted, onUnmounted, Ref } from '@vue/composition-api';
import Vue from 'vue';

type ShortcutHandler = () => void;

let keysdown: string[] = [];
const handlers: Record<string, ShortcutHandler[]> = {};

document.body.addEventListener('keydown', (event: KeyboardEvent) => {
	console.log(event.CAPTURING_PHASE);
	keysdown.push(mapKeys(event.key));
	callHandlers();
});

document.body.addEventListener('keyup', (event: KeyboardEvent) => {
	keysdown = keysdown.filter((key) => key === mapKeys(event.key));
});

function mapKeys(key: string) {
	const map: Record<string, string> = {
		Control: 'meta',
		Command: 'meta',
	};
	return map.hasOwnProperty(key) ? map[key] : key;
}

function callHandlers() {
	Object.entries(handlers).forEach(([key, value]) => {
		const rest = key.split('+').filter((keySegment) => keysdown.includes(keySegment) === false);
		// strg+A   strg+shift+aaaa

		if (rest.length > 0) return;
		value.forEach((f) => f());
	});
}

function filterShortcut(shortcut: string) {
	let sections = shortcut.split('+');
	if (sections.find((s) => s.match(/^[A-Z]$/) !== null)) {
		const filtered = sections.filter((s) => s.toLowerCase() === 'shift');
		if (filtered.length % 2 === 0) {
			sections.unshift('shift');
		} else {
			sections = sections.filter((s) => s.toLowerCase() !== 'shift');
		}
		return sections.join('+').toLowerCase();
	}
	return shortcut.toLowerCase();
}

export default function useShortcut(
	handler: ShortcutHandler,
	reference: Ref<HTMLElement | null> | Ref<Vue | null>,
	...shortcuts: string[]
) {
	const callback: ShortcutHandler = () => {
		if (reference.value === null) return;
		const ref = reference.value instanceof HTMLElement ? reference.value : (reference.value.$el as HTMLElement);

		if (
			document.activeElement === ref ||
			ref.contains(document.activeElement) ||
			document.activeElement === document.body
		) {
			handler();
		}
	};
	onMounted(() => {
		shortcuts.forEach((shortcut) => {
			const s = filterShortcut(shortcut);
			if (handlers.hasOwnProperty(s)) {
				handlers[s].unshift(callback);
			} else {
				handlers[s] = [callback];
			}
		});
	});
	onUnmounted(() => {
		shortcuts.forEach((shortcut) => {
			const s = filterShortcut(shortcut);
			if (handlers.hasOwnProperty(s)) {
				handlers[s] = handlers[s].filter((f) => f !== callback);
			}
		});
	});
}
