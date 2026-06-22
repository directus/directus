<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useResizeObserver } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { type ToolbarButton, toolbarButtons, type ToolbarContext } from './buttons';
import { computeToolbarLayout, type LayoutMeasurements, type RenderGroup } from './compute-toolbar-layout';
import { toolbarGroups } from './groups';
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

const emit = defineEmits<{ 'toggle-fullscreen': []; 'open-image': []; 'open-link': [] }>();

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
	link: {
		open: () => emit('open-link'),
	},
};

// small icon button = 2rem square; separator ~1px rule + side margins; keep in sync with CSS below
const MEASUREMENTS: LayoutMeasurements = {
	buttonWidth: 32,
	gap: 2,
	moreWidth: 32,
	separatorWidth: 9,
	minItems: 5,
};

// keys present in the field config AND in the registry, preserving field order for the `other` bucket
const selectedKeys = computed(() => props.toolbar.filter((key) => Boolean(toolbarButtons[key])));

const container = useTemplateRef<HTMLElement>('container');
const availableWidth = ref(Infinity);

// open state of the "Show More" menu — closed on resize so it can't show a stale/mispositioned overflow set
const overflowMenuActive = ref(false);

useResizeObserver(container, ([entry]) => {
	if (!entry) return;
	// borderBoxSize includes padding; fall back to contentRect minus padding when unavailable
	const box = entry.borderBoxSize?.[0];
	availableWidth.value = box ? box.inlineSize : entry.contentRect.width;
	overflowMenuActive.value = false;
});

const layout = computed(() =>
	computeToolbarLayout(selectedKeys.value, toolbarGroups, availableWidth.value, MEASUREMENTS),
);

const visibleGroups = computed(() => layout.value.visible);
const overflowGroups = computed(() => layout.value.overflow);
const hasOverflow = computed(() => overflowGroups.value.length > 0);

// resolve a render group's keys to button definitions
function resolve(group: RenderGroup): { key: string; button: ToolbarButton }[] {
	return group.keys.map((key) => ({ key, button: toolbarButtons[key]! }));
}

// max width of the "Show More" panel = current toolbar width
const overflowMaxWidth = computed(() => (Number.isFinite(availableWidth.value) ? `${availableWidth.value}px` : '100%'));
</script>

<template>
	<div ref="container" class="toolbar">
		<template v-for="(group, index) in visibleGroups" :key="group.id">
			<div v-if="index > 0" class="toolbar-separator" />
			<ToolbarButtonComp
				v-for="item in resolve(group)"
				:key="item.key"
				:button="item.button"
				:editor="editor"
				:context="context"
				:disabled="disabled"
			/>
		</template>

		<div v-if="hasOverflow" class="toolbar-separator" />

		<VMenu v-if="hasOverflow" v-model="overflowMenuActive" placement="bottom-end" show-arrow>
			<template #activator="{ toggle }">
				<VButton
					v-tooltip="t('show_more')"
					class="toolbar-button toolbar-more"
					:class="{ active: overflowMenuActive }"
					small
					icon
					@click="toggle"
				>
					<VIcon name="more_horiz" />
				</VButton>
			</template>
			<div class="toolbar-overflow" :style="{ '--toolbar-width': overflowMaxWidth }">
				<template v-for="(group, index) in overflowGroups" :key="group.id">
					<div v-if="index > 0" class="toolbar-separator" />
					<ToolbarButtonComp
						v-for="item in resolve(group)"
						:key="item.key"
						:button="item.button"
						:editor="editor"
						:context="context"
						:disabled="disabled"
						tooltip-placement="bottom"
					/>
				</template>
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

.toolbar-separator {
	flex: 0 0 auto;
	align-self: center;
	block-size: 1.25rem;
	margin-inline: 0.125rem;
	border-inline-end: var(--theme--border-width) solid var(--theme--border-color-accent);
}

// Match the ghost styling of the inner toolbar buttons (scoped to toolbar-button.vue, so replicated here).
.toolbar-more {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--primary-ondimmed);
	--v-button-color-active: var(--primary-ondimmed);
	--v-button-background-color: transparent;
	--v-button-background-color-hover: var(--primary-dimmed);
	--v-button-background-color-active: var(--primary-dimmed);
}

// Open menu = active: persist the dimmed-primary fill like an applied format button.
.toolbar-more.active {
	--v-button-background-color: var(--primary-dimmed);
	--v-button-color: var(--primary-ondimmed);
}

.toolbar-overflow {
	--overflow-rows: 2;
	--overflow-gap: 0.125rem;
	--overflow-padding: 0.25rem;
	--overflow-button-size: 2rem;

	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--overflow-gap);
	padding: var(--overflow-padding);
	max-inline-size: var(--toolbar-width, 12rem);
	max-block-size: calc(
		var(--overflow-rows) * var(--overflow-button-size) + (var(--overflow-rows) - 1) * var(--overflow-gap) + 2 *
			var(--overflow-padding)
	);
	overflow-y: auto;
}
</style>
