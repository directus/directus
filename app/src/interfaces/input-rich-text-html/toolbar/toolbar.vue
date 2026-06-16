<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useResizeObserver } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { type ToolbarButton, toolbarButtons, type ToolbarContext } from './buttons';
import ToolbarButtonComp from './toolbar-button.vue';
import { useClipboardActions } from './use-clipboard-actions';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	editor: Editor | undefined;
	toolbar: string[];
	disabled?: boolean;
	fullscreen?: boolean;
}>();

const emit = defineEmits<{ 'toggle-fullscreen': []; 'open-image': [] }>();

const { t } = useI18n();

const clipboard = useClipboardActions();

const context: ToolbarContext = {
	clipboard: {
		copy: clipboard.copySelection,
		cut: clipboard.cutSelection,
		paste: clipboard.paste,
	},
	fullscreen: {
		active: () => props.fullscreen ?? false,
		toggle: () => emit('toggle-fullscreen'),
	},
	image: {
		open: () => emit('open-image'),
	},
};

// small icon button = 2rem square; keep in sync with the CSS gap below
const BUTTON_WIDTH = 32;
const GAP = 2;
const MORE_WIDTH = 32;

// resolve toolbar keys to known buttons; unknown/legacy keys are dropped
const items = computed(() =>
	props.toolbar
		.map((key) => ({ key, button: toolbarButtons[key] }))
		.filter((item): item is { key: string; button: ToolbarButton } => Boolean(item.button)),
);

const container = useTemplateRef<HTMLElement>('container');
const availableWidth = ref(Infinity);

useResizeObserver(container, ([entry]) => {
	if (entry) availableWidth.value = entry.contentRect.width;
});

const visibleCount = computed(() => {
	const total = items.value.length;
	if (!Number.isFinite(availableWidth.value)) return total;

	const perButton = BUTTON_WIDTH + GAP;
	const fitsAll = total * perButton - GAP <= availableWidth.value;
	if (fitsAll) return total;

	return Math.max(1, Math.floor((availableWidth.value - MORE_WIDTH - GAP) / perButton));
});

const visibleItems = computed(() => items.value.slice(0, visibleCount.value));
const overflowItems = computed(() => items.value.slice(visibleCount.value));
</script>

<template>
	<div ref="container" class="toolbar">
		<ToolbarButtonComp
			v-for="item in visibleItems"
			:key="item.key"
			:button="item.button"
			:editor="editor"
			:context="context"
			:disabled="disabled"
		/>

		<VMenu v-if="overflowItems.length" placement="bottom-end" show-arrow>
			<template #activator="{ toggle }">
				<VButton v-tooltip="t('show_more')" class="toolbar-button" small icon @click="toggle">
					<VIcon name="more_horiz" />
				</VButton>
			</template>
			<div class="toolbar-overflow">
				<ToolbarButtonComp
					v-for="item in overflowItems"
					:key="item.key"
					:button="item.button"
					:editor="editor"
					:context="context"
					:disabled="disabled"
				/>
			</div>
		</VMenu>
	</div>
</template>

<style lang="scss" scoped>
.toolbar {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	padding: 0.25rem;
	overflow: hidden;
	background-color: var(--theme--form--field--input--background-subdued);
	border-block-end: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
}

.toolbar-overflow {
	display: flex;
	flex-wrap: wrap;
	gap: 0.125rem;
	max-inline-size: 12rem;
	padding: 0.25rem;
}
</style>
