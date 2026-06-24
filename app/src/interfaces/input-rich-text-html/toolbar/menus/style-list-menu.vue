<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyStyle, readStyle, type StyleAttr } from './text-style';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

interface Item {
	label: string;
	/** CSS value to set, or `null` for the "Default" (unset) entry. */
	value: string | null;
}

const props = withDefaults(
	defineProps<{
		editor: Editor | undefined;
		label: string;
		attr: Extract<StyleAttr, 'fontFamily' | 'fontSize'>;
		items: Item[];
		/** Activator width in px; keep in sync with the layout width hint in buttons.ts. */
		width?: number;
		/** Render each label (and the activator) in its own font — for the font-family picker. */
		previewFont?: boolean;
		/** Activator text when nothing is applied — the editor's effective default (e.g. the base font/size). */
		defaultLabel?: string;
		/** Item value to highlight as active while nothing is applied — the editor's effective default. */
		defaultValue?: string;
		disabled?: boolean;
	}>(),
	{ width: 132, previewFont: false, defaultLabel: undefined, defaultValue: undefined },
);

const { t } = useI18n();

// Read on each render (mirrors toolbar-button's isActive pattern) — editor state isn't a Vue dep.
function current(): string | null {
	return props.editor ? readStyle(props.editor, props.attr) : null;
}

// font-family values round-trip through the DOM, which rewrites single quotes (our item values) to double;
// strip quotes so e.g. `'Arial Black', sans-serif` still matches the reparsed `"Arial Black", sans-serif`.
function normalize(value: string | null): string | null {
	return value === null ? null : value.replace(/['"]/g, '');
}

function isActive(item: Item): boolean {
	const value = current();
	// Nothing applied → highlight the default item, so the menu reflects the editor's effective value.
	if (value === null) return props.defaultValue !== undefined && item.value === props.defaultValue;
	return item.value !== null && normalize(value) === normalize(item.value);
}

/** Item labels that are i18n keys (the "Default" entry) are translated; literal names shown as-is. */
function displayLabel(item: Item): string {
	return item.label.startsWith('wysiwyg_options.') ? t(item.label) : item.label;
}

/** The label shown on the activator: the matched item, the raw value as a fallback, or "Default". */
const currentLabel = computed(() => {
	const value = current();
	if (value === null) return props.defaultLabel ?? t('wysiwyg_options.default');
	const match = props.items.find((item) => normalize(item.value) === normalize(value));
	return match ? displayLabel(match) : value;
});

/** Preview font for the activator label; only the font-family picker has a meaningful value. */
const currentFont = computed(() => (props.previewFont ? current() : null));

/** Apply an item value. Exposed for unit testing without opening the teleported menu. */
function select(value: string | null): void {
	if (props.editor) applyStyle(props.editor, props.attr, value);
}

defineExpose({ select, currentLabel });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<VButton
				v-tooltip="t(label)"
				class="style-list-button toolbar-button"
				:class="{ active: active || current() !== null }"
				:style="{ '--style-list-width': `${width}px` }"
				:disabled="disabled || !editor"
				small
				@click="toggle"
			>
				<span class="style-list-label" :style="currentFont ? { fontFamily: currentFont } : undefined">
					{{ currentLabel }}
				</span>
				<VIcon class="style-list-caret" name="expand_more" small />
			</VButton>
		</template>
		<VList class="style-list">
			<VListItem v-for="item in items" :key="item.label" clickable :active="isActive(item)" @click="select(item.value)">
				<VListItemContent>
					<span :style="previewFont && item.value ? { fontFamily: item.value } : undefined">
						{{ displayLabel(item) }}
					</span>
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
@use '../ghost-button' as *;

.style-list-button {
	@include ghost-toolbar-button;
}

// Set width on the inner `.button` directly — `small` redefines `--v-button-min-width` there, so an
// ancestor-level var override would lose.
.style-list-button :deep(.button) {
	inline-size: var(--style-list-width);
	min-inline-size: var(--style-list-width);
	padding-inline: 0.5rem;
}

// `.content` wraps the slot; make it fill the button so the caret is pinned to the end.
.style-list-button :deep(.content) {
	inline-size: 100%;
	justify-content: space-between;
}

.style-list-label {
	flex: 1 1 auto;
	min-inline-size: 0;
	overflow: hidden;
	text-align: start;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.style-list-caret {
	flex: 0 0 auto;
	margin-inline-start: 0.25rem;
}

.toolbar-button.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
}

.style-list {
	min-inline-size: 10rem;
	max-block-size: 18rem;
	overflow-y: scroll;
}
</style>
