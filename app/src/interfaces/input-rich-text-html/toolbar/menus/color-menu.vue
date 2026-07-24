<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ToolbarCaret from '../toolbar-caret.vue';
import { applyStyle, readStyle, type StyleAttr } from './text-style';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';
import SelectColor from '@/interfaces/select-color/select-color.vue';

const props = defineProps<{
	editor: Editor | undefined;
	icon: string;
	label: string;
	mode: 'text' | 'background';
	disabled?: boolean;
}>();

const { t } = useI18n();

const attr = computed<StyleAttr>(() => (props.mode === 'text' ? 'color' : 'backgroundColor'));

function current(): string | null {
	return props.editor ? readStyle(props.editor, attr.value) : null;
}

/** Apply (or clear, on null/empty) the color. Exposed for unit testing. */
function apply(value: string | null): void {
	if (props.editor) applyStyle(props.editor, attr.value, value && value.length ? value : null);
}

defineExpose({ apply });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow :close-on-content-click="false">
		<template #activator="{ toggle, active }">
			<VButton
				v-tooltip="t(label)"
				class="toolbar-button"
				ghost
				:active="active || current() !== null"
				:disabled="disabled || !editor"
				small
				icon
				@click="toggle"
			>
				<VIcon :name="icon" :style="current() ? { color: current()! } : undefined" />
				<ToolbarCaret class="color-menu-caret" />
			</VButton>
		</template>
		<div class="color-menu">
			<SelectColor :value="current()" width="full" @input="apply" />
		</div>
	</VMenu>
</template>

<style lang="scss" scoped>
// Active (a color applied, or the menu open) uses a neutral fill instead of the ghost primary tint.
// `.ghost` in the selector raises specificity above VButton's own `.ghost.active` rule.
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}

// `icon` makes VButton a tight square with no padding; icon + caret need more room. Widen to fit both
// (keep in sync with `CARET_BUTTON_WIDTH` in buttons.ts, `2.5rem` = 40px) and center the content.
.toolbar-button :deep(.button.icon) {
	inline-size: 2.5rem;
	justify-content: center;
}

.color-menu-caret {
	margin-inline-start: -0.125rem;
}

.color-menu {
	inline-size: 18rem;
	padding: 0.5rem;
}
</style>
