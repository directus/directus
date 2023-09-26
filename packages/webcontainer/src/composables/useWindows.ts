import { Ref, ref } from "vue";

export interface Window {
	id: number;
	name: string;
	icon: string;
	open: boolean;
	focus: number;
	component: string;
	options?: Record<string, any>;
}

export function useWindows(): {
	windows: Ref<readonly Window[]>;
	add: (window: string, options?: Record<string, any>) => void;
	remove: (id: number) => void;
	focus: (id: number) => void;
	toggle: (id: number) => boolean;
} {
	let uid = 0

	const windows = ref<Window[]>([]);

	return { windows, add, remove, focus, toggle }

	function remove(id: number) {
		windows.value = windows.value.filter((w) => w.id !== id);
	}

	function add(window: string, options?: Record<string, any>) {
		const id = uid

		windows.value.push({
			id,
			name: window,
			icon: window.toLowerCase(),
			open: false,
			focus: 1,
			options,
			component: window.toLowerCase(),
		});

		setTimeout(() => focus(id), 10)

		uid++;
	}

	function toggle(id: number) {
		const targetWindow = windows.value.find((w) => w.id === id);

		if (!targetWindow) return false

		targetWindow.open = !targetWindow.open

		if (targetWindow.focus !== 1) {
			focus(id);
			return true
		}

		return false
	}

	function focus(id: number) {
		windows.value = windows.value.map((w) => {
			w.focus += 1;

			if (w.id === id) {
				w.open = true;
				w.focus = 1;
			}

			return w;
		});
	}
}
