import { computed, nextTick } from 'vue';
import { useCommandPalette } from './use-command-palette';
import { useAiStore } from '@/ai/stores/use-ai';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';

/**
 * Hands the command palette's current query off to the AI assistant.
 *
 * Opens the chat sidebar with the query pre-filled but does not submit it — the user
 * presses send. Page/collection context is carried implicitly by the AI store's
 * `currentPageContext`, so nothing is seeded here.
 */
export function useAskAi() {
	const context = useCommandPalette();
	const serverStore = useServerStore();
	const settingsStore = useSettingsStore();

	const aiAvailable = computed(() => serverStore.info.ai_enabled && settingsStore.availableAiProviders.length > 0);

	const askAiShortcutModifierIcon = computed(() =>
		navigator.platform.toUpperCase().includes('MAC') ? 'keyboard_command_key' : 'keyboard_control_key',
	);

	function askAi(query: string) {
		if (!aiAvailable.value || !query) return;

		const aiStore = useAiStore();
		aiStore.input = query;
		aiStore.chatOpen = true;
		context.close();

		// Focus the chat input once the sidebar has expanded and the textarea is mounted,
		// so the pre-filled query is ready to edit/send.
		nextTick(() => aiStore.focusInput());
	}

	return { aiAvailable, askAi, askAiShortcutModifierIcon };
}
