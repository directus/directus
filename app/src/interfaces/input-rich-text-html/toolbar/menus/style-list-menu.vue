<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
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

const props = defineProps<{
	editor: Editor | undefined;
	icon: string;
	label: string;
	attr: Extract<StyleAttr, 'fontFamily' | 'fontSize'>;
	items: Item[];
	disabled?: boolean;
}>();

const { t } = useI18n();

// Read on each render (mirrors toolbar-button's isActive pattern) — editor state isn't a Vue dep.
function current(): string | null {
	return props.editor ? readStyle(props.editor, props.attr) : null;
}

function isActive(item: Item): boolean {
	return item.value !== null && current() === item.value;
}

/** Item labels that are i18n keys (the "Default" entry) are translated; literal names shown as-is. */
function displayLabel(item: Item): string {
	return item.label.startsWith('wysiwyg_options.') ? t(item.label) : item.label;
}

/** Apply an item value. Exposed for unit testing without opening the teleported menu. */
function select(value: string | null): void {
	if (props.editor) applyStyle(props.editor, props.attr, value);
}

defineExpose({ select });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<VButton
				v-tooltip="t(label)"
				class="toolbar-button"
				:class="{ active: active || current() !== null }"
				:disabled="disabled || !editor"
				small
				icon
				@click="toggle"
			>
				<VIcon :name="icon" />
			</VButton>
		</template>
		<VList class="style-list">
			<VListItem v-for="item in items" :key="item.label" clickable :active="isActive(item)" @click="select(item.value)">
				<VListItemContent>
					<span :style="attr === 'fontFamily' && item.value ? { fontFamily: item.value } : undefined">
						{{ displayLabel(item) }}
					</span>
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.toolbar-button.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
}

.style-list {
	min-inline-size: 10rem;
	max-block-size: 18rem;
	overflow-y: auto;
}
</style>
