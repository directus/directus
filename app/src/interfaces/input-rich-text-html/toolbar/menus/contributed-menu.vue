<script setup lang="ts">
import type { RichTextMenuButton, RichTextMenuItem } from '@directus/extensions';
import type { Editor } from '@tiptap/vue-3';
import { ref } from 'vue';
import ToolbarCaret from '../toolbar-caret.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	editor: Editor | undefined;
	button: RichTextMenuButton;
	disabled?: boolean;
}>();

const menuOpen = ref(false);

// editor state is not a Vue dependency, so these read on each render, like toolbar-button's isActive
function isItemActive(item: RichTextMenuItem): boolean {
	return !!(props.editor && item.isActive?.(props.editor));
}

function isItemDisabled(item: RichTextMenuItem): boolean {
	return !props.editor || !!item.isDisabled?.(props.editor);
}

function isActive(): boolean {
	if (!props.editor) return false;
	if (props.button.isActive) return props.button.isActive(props.editor);
	return props.button.items.some(isItemActive);
}

function isDisabled(): boolean {
	return props.disabled || !props.editor || !!props.button.isDisabled?.(props.editor);
}

function run(item: RichTextMenuItem): void {
	if (!props.editor || isItemDisabled(item)) return;
	item.command(props.editor);
	menuOpen.value = false;
}
</script>

<template>
	<VMenu v-model="menuOpen" placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<!-- .stop keeps a parent menu (the "Show More" overflow panel) open when this lives inside it -->
			<VButton
				v-tooltip="button.label"
				class="toolbar-button toolbar-popover"
				ghost
				:active="active || isActive()"
				:disabled="isDisabled()"
				small
				icon
				@click.stop="toggle"
			>
				<VIcon :name="button.icon" />
				<ToolbarCaret class="toolbar-popover-caret" />
			</VButton>
		</template>
		<VList>
			<VListItem
				v-for="item in button.items"
				:key="item.key"
				clickable
				:active="isItemActive(item)"
				:disabled="isItemDisabled(item)"
				@click="run(item)"
			>
				<VListItemIcon v-if="item.icon"><VIcon :name="item.icon" /></VListItemIcon>
				<VListItemContent>{{ item.label }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}

.toolbar-popover :deep(.button.icon) {
	inline-size: 2.5rem;
	justify-content: center;
}

.toolbar-popover-caret {
	margin-inline-start: -0.125rem;
}
</style>
