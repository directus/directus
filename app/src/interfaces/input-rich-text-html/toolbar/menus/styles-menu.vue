<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CustomFormat } from '../../extensions/custom-formats';
import ToolbarCaret from '../toolbar-caret.vue';
import VButton from '@/components/v-button.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = withDefaults(
	defineProps<{
		editor: Editor | undefined;
		label: string;
		/** Custom formats built from the field's `customFormats` option. */
		formats: CustomFormat[];
		/** Activator width in px; keep in sync with the layout width hint in buttons.ts. */
		width?: number;
		disabled?: boolean;
	}>(),
	{ width: 132 },
);

const { t } = useI18n();

// Read on each render (mirrors toolbar-button's isActive pattern) — editor state isn't a Vue dep.
function isFormatActive(format: CustomFormat): boolean {
	return props.editor ? props.editor.isActive(format.name) : false;
}

/** The active format's title, or the generic label when nothing applies. */
const currentLabel = computed(() => {
	const active = props.formats.find((format) => isFormatActive(format));
	return active ? active.title : t(props.label);
});

const anyActive = computed(() => props.formats.some((format) => isFormatActive(format)));

/** Toggle a format mark by name. Exposed for unit testing without opening the teleported menu. */
function select(name: string): void {
	props.editor?.chain().focus().toggleMark(name).run();
}

defineExpose({ select, isFormatActive, currentLabel });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<VButton
				v-tooltip="t(label)"
				class="style-list-button toolbar-button"
				ghost
				:active="active || anyActive"
				:style="{ '--style-list-width': `${width}px` }"
				:disabled="disabled || !editor"
				small
				@click.stop="toggle"
			>
				<span class="style-list-label">{{ currentLabel }}</span>
				<ToolbarCaret class="style-list-caret" />
			</VButton>
		</template>
		<VList class="style-list">
			<VListItem
				v-for="format in formats"
				:key="format.name"
				clickable
				:active="isFormatActive(format)"
				@click="select(format.name)"
			>
				<VListItemContent>
					<span :style="format.previewStyle">{{ format.title }}</span>
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
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

// Active (a format applied, or the menu open) uses a neutral fill instead of the ghost primary tint.
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}

.style-list {
	min-inline-size: 10rem;
	max-block-size: 18rem;
	overflow-y: scroll;
}
</style>
