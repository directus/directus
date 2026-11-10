import type { RichTextMenuItem, RichTextToolbarButton } from '@directus/extensions';
import type { Editor } from '@tiptap/vue-3';
import { ref } from 'vue';

type Callbacks = Pick<RichTextMenuItem, 'isActive' | 'isDisabled'> & { command?: (editor: Editor) => void };

/**
 * Extension callbacks run during render and on every transaction, so one that throws is disabled and
 * logged once instead of breaking the editor.
 */
export function useContributedGuard() {
	const failed = ref(new Set<string>());

	function guard<T>(key: string, fallback: T, run: () => T): T {
		if (failed.value.has(key)) return fallback;

		try {
			return run();
		} catch (error) {
			failed.value = new Set([...failed.value, key]);
			// eslint-disable-next-line no-console
			console.error(`Richtext extension callback "${key}" threw and was disabled:`, error);
			return fallback;
		}
	}

	function guardCallbacks<T extends Callbacks>(key: string, entry: T): T {
		const { command, isActive, isDisabled } = entry;

		return {
			...entry,
			...(command ? { command: (editor: Editor) => guard(key, undefined, () => command(editor)) } : {}),
			...(isActive ? { isActive: (editor: Editor) => guard(key, false, () => isActive(editor)) } : {}),
			isDisabled: (editor: Editor) => failed.value.has(key) || guard(key, false, () => !!isDisabled?.(editor)),
		};
	}

	function guardButton<T extends RichTextToolbarButton>(key: string, button: T): T {
		const guarded = guardCallbacks(key, button);
		if (!guarded.items) return guarded;
		return { ...guarded, items: guarded.items.map((item) => guardCallbacks(`${key}:${item.key}`, item)) };
	}

	return { guard, guardButton };
}
