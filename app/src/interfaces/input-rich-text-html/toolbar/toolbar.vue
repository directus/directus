<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import type { Editor } from '@tiptap/vue-3';
import { useResizeObserver } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CustomFormat } from '../extensions/custom-formats';
import { type ToolbarButton, toolbarButtons, type ToolbarContext } from './buttons';
import { computeToolbarLayout, type LayoutMeasurements, type RenderGroup } from './compute-toolbar-layout';
import { toolbarGroups } from './groups';
import ToolbarButtonComp from './toolbar-button.vue';
import ToolbarPopover from './toolbar-popover.vue';
import { useClipboardActions } from './use-clipboard-actions';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';

const props = withDefaults(
	defineProps<{
		editor: Editor | undefined;
		toolbar: string[];
		/** Field `font` option — drives the editor's base font, and thus the font-family dropdown default. */
		font?: 'sans-serif' | 'serif' | 'monospace';
		/** Custom formats built from the field's `customFormats` option; auto-appends the styles dropdown. */
		customFormats?: CustomFormat[];
		disabled?: boolean;
		fullscreen?: boolean;
		visualaid?: boolean;
	}>(),
	{ font: 'sans-serif', customFormats: () => [] },
);

const emit = defineEmits<{ 'toggle-fullscreen': []; 'toggle-visualaid': []; 'open-image': []; 'open-link': [] }>();

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
	visualaid: {
		active: () => props.visualaid ?? false,
		toggle: () => emit('toggle-visualaid'),
	},
	image: {
		open: () => emit('open-image'),
	},
	link: {
		open: () => emit('open-link'),
	},
};

// labeled dropdowns (font family/size) declare their own width; the rest are 2rem squares
const keyWidths = Object.fromEntries(
	Object.entries(toolbarButtons)
		.filter(([, button]) => button.width !== undefined)
		.map(([key, button]) => [key, button.width!]),
);

// small icon button = 2rem square; separator ~1px rule + side margins; keep in sync with CSS below
const MEASUREMENTS: LayoutMeasurements = {
	buttonWidth: 32,
	gap: 2,
	moreWidth: 32,
	separatorWidth: 9,
	minItems: 5,
	popoverWidth: 40,
	keyWidths,
};

// keys present in the field config AND in the registry, preserving field order for the `other` bucket.
// `styles` is never user-configured: it's auto-appended (and only present) when customFormats exist,
// matching the legacy TinyMCE behavior (`toolbarString += ' styles'`).
const selectedKeys = computed(() => {
	const keys = props.toolbar.filter((key) => key !== 'styles' && Boolean(toolbarButtons[key]));
	if (props.customFormats.length > 0) keys.push('styles');
	return keys;
});

// editor base font-size — mirrors `.ProseMirror { font-size: 0.875rem }` (14px) in input-rich-text-html.vue
const BASE_FONT_SIZE_PX = 14;

// Defaults the style dropdowns show when nothing is applied: the family resolves the active theme's
// font token for the field's `font` option; the size mirrors the editor's fixed base size.
const styleDefaults = computed<Record<string, Partial<Record<'defaultLabel' | 'defaultValue', string>>>>(() => {
	const token = props.font === 'sans-serif' ? 'sans' : props.font;
	const family = cssVar(`--theme--fonts--${token}--font-family`).replace(/["']/g, '');

	return {
		fontfamily: { defaultLabel: family },
		fontsize: { defaultLabel: String(BASE_FONT_SIZE_PX), defaultValue: `${BASE_FONT_SIZE_PX}px` },
	};
});

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

// resolve a render group's keys to button definitions, injecting per-render props: the derived style
// defaults (font family/size) and the dynamic custom-format list for the styles dropdown.
function resolve(group: RenderGroup): { key: string; button: ToolbarButton }[] {
	return group.keys.map((key) => {
		const button = toolbarButtons[key]!;
		const extra = key === 'styles' ? { formats: props.customFormats } : styleDefaults.value[key];
		if (!extra) return { key, button };
		return { key, button: { ...button, componentProps: { ...button.componentProps, ...extra } } };
	});
}

// max width of the "Show More" panel = current toolbar width
const overflowMaxWidth = computed(() => (Number.isFinite(availableWidth.value) ? `${availableWidth.value}px` : '100%'));
</script>

<template>
	<div ref="container" class="toolbar">
		<!-- visible groups clip here; the "Show More" block lives outside so it can never be clipped -->
		<div class="toolbar-main">
			<template v-for="(group, index) in visibleGroups" :key="group.id">
				<div v-if="index > 0" class="toolbar-separator" />
				<ToolbarPopover v-if="group.popover" :group="group" :editor="editor" :context="context" :disabled="disabled" />
				<ToolbarButtonComp
					v-for="item in resolve(group)"
					v-else
					:key="item.key"
					:button="item.button"
					:editor="editor"
					:context="context"
					:disabled="disabled"
				/>
			</template>
		</div>

		<div v-if="hasOverflow" class="toolbar-more-group">
			<div class="toolbar-separator" />

			<VMenu v-model="overflowMenuActive" placement="bottom-end" show-arrow>
				<template #activator="{ toggle }">
					<VButton
						v-tooltip="t('show_more')"
						class="toolbar-button toolbar-more"
						ghost
						:active="overflowMenuActive"
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
						<ToolbarPopover
							v-if="group.popover"
							:group="group"
							:editor="editor"
							:context="context"
							:disabled="disabled"
						/>
						<ToolbarButtonComp
							v-for="item in resolve(group)"
							v-else
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

// visible groups live here and clip when they don't fit; min-inline-size:0 lets it shrink below content
.toolbar-main {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	flex: 0 1 auto;
	min-inline-size: 0;
	overflow: hidden;
}

// the "Show More" control never shrinks, so it stays visible even when the main row clips; the auto
// inline-start margin anchors it to the end of the toolbar regardless of how many groups are visible
.toolbar-more-group {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	flex: 0 0 auto;
	margin-inline-start: auto;
}

.toolbar-separator {
	flex: 0 0 auto;
	align-self: center;
	block-size: 1.25rem;
	margin-inline: 0.125rem;
	border-inline-end: var(--theme--border-width) solid var(--theme--border-color-accent);
}

.toolbar-overflow {
	--ov-rows: 2;
	--ov-gap: 0.125rem;
	--ov-pad: 0.25rem;
	--ov-btn: 2rem;

	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--ov-gap);
	padding: var(--ov-pad);
	max-inline-size: var(--toolbar-width, 12rem);
	max-block-size: calc(var(--ov-rows) * var(--ov-btn) + (var(--ov-rows) - 1) * var(--ov-gap) + 2 * var(--ov-pad));
	overflow-y: auto;
}
</style>
