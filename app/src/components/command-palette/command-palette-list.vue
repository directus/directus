<script setup lang="ts">
import { ListboxContent } from 'reka-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCommandPalette } from './composables/use-command-palette';
import CommandPaletteInput from './command-palette-input.vue';

const { t } = useI18n();

const props = defineProps<{
	searchBarPlaceholder?: string;
}>();

const { loading, search, router } = useCommandPalette();
const showBack = computed(() => router.stack.value.length > 1);
const placeholder = computed(() => props.searchBarPlaceholder ?? `${t('search')}...`);
</script>

<template>
	<CommandPaletteInput v-model="search" :loading="loading" :placeholder="placeholder" :show-back="showBack" @back="router.pop()" />
	<ListboxContent class="command-list">
		<div class="command-list-viewport">
			<slot />
		</div>
	</ListboxContent>
	<div class="command-footer">
		<span>
			<v-icon name="sync_alt" />
			<span>{{ t('navigate') }}</span>
		</span>
		<span>
			<v-icon name="keyboard_return" />
			<span>{{ t('command_palette_select') }}</span>
		</span>
		<span>
			<v-icon name="keyboard_backspace" />
			<span>{{ t('back') }}</span>
		</span>
	</div>
</template>

<style scoped lang="scss">
.command-list {
	max-height: 50vh;
	overflow-y: auto;
}

.command-list-viewport {
	padding: 4px;
}

.command-footer {
	--v-icon-size: 18px;
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	justify-content: end;
	gap: 12px;
	padding: 8px 12px;
	color: var(--theme--foreground-subdued);
	border-top: solid 1px var(--theme--border-color);

	:deep([data-icon='sync_alt']) {
		transform: rotate(90deg);
	}

	& > span {
		display: flex;
		align-items: center;
		gap: 6px;
	}
}
</style>
