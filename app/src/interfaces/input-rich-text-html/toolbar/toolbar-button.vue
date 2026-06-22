<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ToolbarButton, ToolbarContext } from './buttons';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	button: ToolbarButton;
	editor: Editor | undefined;
	context: ToolbarContext;
	disabled?: boolean;
	tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}>();

const { t } = useI18n();

const placement = computed(() => props.tooltipPlacement ?? 'top');
</script>

<template>
	<component
		:is="button.component"
		v-if="button.component"
		:editor="editor"
		:disabled="disabled"
		v-bind="button.componentProps"
	/>
	<VButton
		v-else
		v-tooltip:[placement]="t(button.label)"
		class="toolbar-button"
		:class="{ active: editor && button.isActive?.(editor, context) }"
		:disabled="disabled || (editor ? button.disabled?.(editor) : true)"
		small
		icon
		@click="editor && button.command?.(editor, context)"
	>
		<VIcon :name="button.icon" />
	</VButton>
</template>

<style lang="scss" scoped>
@use './ghost-button' as *;

.toolbar-button {
	@include ghost-toolbar-button;
}

// The active state marks an applied format, so it persists the dimmed-primary fill at rest.
.toolbar-button.active {
	--v-button-background-color: var(--primary-dimmed);
	--v-button-color: var(--primary-ondimmed);
}
</style>
