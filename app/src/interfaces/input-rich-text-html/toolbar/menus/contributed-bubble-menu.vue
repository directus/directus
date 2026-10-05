<script setup lang="ts">
import type { RichTextBubbleMenu } from '@directus/extensions';
import type { Editor } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import { computed, shallowRef } from 'vue';
import { useContributedGuard } from '../use-contributed-guard';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	editor: Editor | undefined;
	/** The menus of every extension the field enabled, keys prefixed by extension id. */
	menus: RichTextBubbleMenu[];
}>();

const { guard, guardButton } = useContributedGuard();

const guardedMenus = computed(() =>
	props.menus.map((menu) => ({
		...menu,
		buttons: menu.buttons.map((button) => guardButton(`${menu.key}:${button.key}`, button)),
	})),
);

const activeMenu = shallowRef<RichTextBubbleMenu | null>(null);

// one BubbleMenu for all extensions, so two menus never stack on the same selection
function updateActiveMenu(): boolean {
	const editor = props.editor;

	activeMenu.value =
		editor && editor.isEditable && !editor.isActive('table')
			? (guardedMenus.value.find((menu) => guard(menu.key, false, () => menu.shouldShow(editor))) ?? null)
			: null;

	return activeMenu.value !== null;
}

defineExpose({ updateActiveMenu });
</script>

<template>
	<div class="contributed-bubble-menu-anchor">
		<!-- Stable attached root: BubbleMenu detaches its own root el on mount, see table-bubble-menu.vue -->
		<BubbleMenu
			v-if="editor"
			:editor="editor"
			plugin-key="contributedBubbleMenu"
			:should-show="updateActiveMenu"
			:options="{ placement: 'top', offset: 8 }"
		>
			<div v-if="activeMenu" class="contributed-bubble-menu">
				<VButton
					v-for="button in activeMenu.buttons"
					:key="button.key"
					v-tooltip="button.label"
					class="toolbar-button"
					ghost
					small
					icon
					:active="!!button.isActive?.(editor)"
					:disabled="!!button.isDisabled?.(editor)"
					@click="button.command(editor)"
				>
					<VIcon :name="button.icon" />
				</VButton>
			</div>
		</BubbleMenu>
	</div>
</template>

<style lang="scss" scoped>
.contributed-bubble-menu-anchor {
	display: contents;
}

.contributed-bubble-menu {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	padding: 0.25rem;
	color: var(--theme--popover--menu--foreground);
	background-color: var(--theme--popover--menu--background);
	border-radius: var(--theme--popover--menu--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
}
</style>
