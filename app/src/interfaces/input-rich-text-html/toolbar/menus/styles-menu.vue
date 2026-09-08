<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isBlockFormatActive, toggleBlockFormat } from '../../extensions/block-formats';
import type { CustomFormat } from '../../extensions/custom-formats';
import ToolbarCaret from '../toolbar-caret.vue';
import SubmenuListItem from './submenu-list-item.vue';
import VButton from '@/components/v-button.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

/** A format that can be applied — i.e. anything but a group row. */
type LeafFormat = Extract<CustomFormat, { name: string }>;

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

/**
 * Editor state is not a Vue dependency, so the label/active computeds would cache their first read
 * forever. Bumping this on each transaction is what makes them follow the selection.
 */
const revision = ref(0);

watch(
	() => props.editor,
	(editor, _previous, onCleanup) => {
		if (!editor) return;
		const bump = (): void => void revision.value++;
		editor.on('transaction', bump);
		onCleanup(() => editor.off('transaction', bump));
	},
	{ immediate: true },
);

/** Group rows aren't selectable themselves, so label/active state read the leaves. */
const leaves = computed<LeafFormat[]>(() =>
	props.formats.flatMap((format) => (format.kind === 'group' ? format.items : [format])),
);

// Read on each render (mirrors toolbar-button's isActive pattern) — editor state isn't a Vue dep.
function isFormatActive(format: CustomFormat): boolean {
	if (!props.editor || format.kind === 'group') return false;
	// block formats live on node attributes, so `isActive` (marks + node types) can't see them
	if (format.kind === 'block') return isBlockFormatActive(props.editor, format);
	return props.editor.isActive(format.name);
}

/** The active format's title, or the generic label when nothing applies. */
const currentLabel = computed(() => {
	void revision.value;
	const active = leaves.value.find((format) => isFormatActive(format));
	return active ? active.title : t(props.label);
});

const anyActive = computed(() => {
	void revision.value;
	return leaves.value.some((format) => isFormatActive(format));
});

/** Toggle a format on the selection. Exposed for unit testing without opening the teleported menu. */
function select(format: CustomFormat): void {
	if (!props.editor || format.kind === 'group') return;
	if (format.kind === 'block') toggleBlockFormat(props.editor, format);
	else props.editor.chain().focus().toggleMark(format.name).run();
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
			<template v-for="(format, index) in formats" :key="format.kind === 'group' ? `group-${index}` : format.name">
				<SubmenuListItem v-if="format.kind === 'group'" :label="format.title">
					<VListItem
						v-for="item in format.items"
						:key="item.name"
						clickable
						:active="isFormatActive(item)"
						@click="select(item)"
					>
						<VListItemContent>
							<span :style="item.previewStyle">{{ item.title }}</span>
						</VListItemContent>
					</VListItem>
				</SubmenuListItem>
				<VListItem v-else clickable :active="isFormatActive(format)" @click="select(format)">
					<VListItemContent>
						<span :style="format.previewStyle">{{ format.title }}</span>
					</VListItemContent>
				</VListItem>
			</template>
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
