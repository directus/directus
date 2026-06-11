<script setup lang="ts">
import { ListboxContent } from 'reka-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CommandPaletteInput from './command-palette-input.vue';
import { useAskAi } from './composables/use-ask-ai';
import { useCommandPalette } from './composables/use-command-palette';
import VIcon from '@/components/v-icon/v-icon.vue';

const { t } = useI18n();

const props = defineProps<{
	searchBarPlaceholder?: string;
}>();

const { loading, search, router } = useCommandPalette();
const showBack = computed(() => router.stack.value.length > 1);
const placeholder = computed(() => props.searchBarPlaceholder ?? `${t('search')}...`);

const { aiAvailable, askAi } = useAskAi();

// Handle the Ask AI chord in capture phase so it runs before reka-ui's ListboxFilter
// Enter handler (which stops propagation to select the highlighted item). Only swallow
// the keystroke when AI is actually available — otherwise let it fall through to reka.
function onChordKeydown(event: KeyboardEvent) {
	if (!aiAvailable.value || !search.value) return;
	if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return;

	event.stopPropagation();
	event.preventDefault();
	askAi(search.value);
}
</script>

<template>
	<CommandPaletteInput
		v-model="search"
		:loading="loading"
		:placeholder="placeholder"
		:show-back="showBack"
		@back="router.pop()"
		@keydown.capture="onChordKeydown"
	/>
	<ListboxContent class="command-list">
		<div class="command-list-viewport">
			<slot />
		</div>
	</ListboxContent>
	<div class="command-footer">
		<span>
			<VIcon name="sync_alt" />
			<span>{{ t('navigate') }}</span>
		</span>
		<span>
			<VIcon name="keyboard_return" />
			<span>{{ t('command_palette_select') }}</span>
		</span>
		<span>
			<VIcon name="keyboard_backspace" />
			<span>{{ t('back') }}</span>
		</span>
	</div>
</template>

<style scoped lang="scss">
.command-list {
	max-block-size: 50vh;
	overflow-y: auto;
}

.command-list-viewport {
	padding: 0.25rem;
}

.command-footer {
	--v-icon-size: 1.125rem;
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	justify-content: end;
	gap: 0.75rem;
	padding: 0.5rem 0.75rem;
	color: var(--theme--foreground-subdued);
	border-block-start: solid 0.0625rem var(--theme--border-color);

	:deep([data-icon='sync_alt']) {
		transform: rotate(90deg);
	}

	& > span {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
}
</style>
