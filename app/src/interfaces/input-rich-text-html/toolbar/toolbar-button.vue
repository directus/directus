<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useI18n } from 'vue-i18n';
import type { ToolbarButton, ToolbarContext } from './buttons';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	button: ToolbarButton;
	editor: Editor | undefined;
	context: ToolbarContext;
	disabled?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
	<VButton
		v-tooltip="t(button.label)"
		class="toolbar-button"
		:class="{ active: editor && button.isActive?.(editor, context) }"
		:disabled="disabled || (editor ? button.disabled?.(editor) : true)"
		ghost
		small
		icon
		@click="editor && button.command(editor, context)"
	>
		<VIcon :name="button.icon" />
	</VButton>
</template>

<style lang="scss" scoped>
// `ghost` (transparent + dimmed-primary hover/active) comes from VButton; the active
// state here marks an applied format, so it persists the dimmed-primary fill at rest.
.toolbar-button.active {
	--v-button-background-color: var(--primary-dimmed);
	--v-button-color: var(--primary-ondimmed);
}
</style>
