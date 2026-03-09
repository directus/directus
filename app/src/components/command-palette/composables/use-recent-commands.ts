import { useLocalStorage } from '@vueuse/core';
import { readonly } from 'vue';

const recent = useLocalStorage<string[]>('command-palette:recent-commands', []);

const DEFAULT_LIMIT = 5;

export function useRecentCommands(limit = DEFAULT_LIMIT) {
	function add(id: string) {
		const index = recent.value.indexOf(id);

		if (index !== -1) {
			recent.value.splice(index, 1);
		}

		recent.value.unshift(id);

		if (recent.value.length > limit) {
			recent.value.pop();
		}
	}

	return {
		commands: readonly(recent),
		add,
	};
}
