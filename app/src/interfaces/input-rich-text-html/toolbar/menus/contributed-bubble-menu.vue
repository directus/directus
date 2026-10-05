<script setup lang="ts">
import type { RichTextBubbleMenu } from '@directus/extensions';
import type { Editor } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import { shallowRef } from 'vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	editor: Editor | undefined;
	/** The menus of every extension the field enabled, keys prefixed by extension id. */
	menus: RichTextBubbleMenu[];
}>();

const activeMenu = shallowRef<RichTextBubbleMenu | null>(null);

// shouldShow runs on every transaction, so a broken menu logs once instead of flooding the console
const reported = new Set<string>();

function matches(menu: RichTextBubbleMenu, editor: Editor): boolean {
	try {
		return menu.shouldShow(editor);
	} catch (error) {
		if (!reported.has(menu.key)) {
			reported.add(menu.key);
			// eslint-disable-next-line no-console
			console.error(`Richtext bubble menu "${menu.key}" threw in shouldShow, so it stays hidden:`, error);
		}

		return false;
	}
}

// one BubbleMenu for all extensions, so two menus never stack on the same selection
function shouldShow(): boolean {
	const editor = props.editor;

	activeMenu.value =
		editor && editor.isEditable && !editor.isActive('table')
			? (props.menus.find((menu) => matches(menu, editor)) ?? null)
			: null;

	return activeMenu.value !== null;
}

defineExpose({ shouldShow });
</script>

<template>
	<div class="contributed-bubble-menu-anchor">
		<!-- Stable attached root: BubbleMenu detaches its own root el on mount, see table-bubble-menu.vue -->
		<BubbleMenu
			v-if="editor"
			:editor="editor"
			plugin-key="contributedBubbleMenu"
			:should-show="shouldShow"
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
