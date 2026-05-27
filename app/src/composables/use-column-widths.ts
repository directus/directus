import { useEventListener, useLocalStorage } from '@vueuse/core';
import { type MaybeRefOrGetter, ref } from 'vue';

/**
 * Persists table column widths to localStorage, batching writes so they only
 * occur on pointerup (end of drag) rather than on every pointermove event.
 *
 * During a drag, width updates are held in `pendingColumnWidths` (in-memory)
 * and flushed to `columnWidths` (localStorage) once the user releases the pointer.
 */
export function useColumnWidths(storageKey: MaybeRefOrGetter<string>) {
	const columnWidths = useLocalStorage<Record<string, number>>(storageKey, {});

	const pendingColumnWidths = ref<Record<string, number>>({});

	useEventListener(window, 'pointerup', () => {
		if (Object.keys(pendingColumnWidths.value).length > 0) {
			columnWidths.value = { ...columnWidths.value, ...pendingColumnWidths.value };
			pendingColumnWidths.value = {};
		}
	});

	function getWidth(key: string, defaultWidth: number): number {
		return pendingColumnWidths.value[key] ?? columnWidths.value[key] ?? defaultWidth;
	}

	function updateWidths(headers: Array<{ value: string; width?: number }>) {
		const widths: Record<string, number> = {};

		headers.forEach((h) => {
			widths[h.value] = h.width ?? 160;
		});

		pendingColumnWidths.value = { ...pendingColumnWidths.value, ...widths };
	}

	return { getWidth, updateWidths };
}
