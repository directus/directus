<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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
				:class="{ active: active || current() !== null }"
				:disabled="disabled || !editor"
				small
				icon
				@click="toggle"
			>
				<VIcon :name="icon" :style="current() ? { color: current()! } : undefined" />
			</VButton>
		</template>
		<div class="color-menu">
			<SelectColor :value="current()" width="full" @input="apply" />
		</div>
	</VMenu>
</template>

<style lang="scss" scoped>
@use '../ghost-button' as *;

.toolbar-button {
	@include ghost-toolbar-button;
}

.toolbar-button.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
}

.color-menu {
	inline-size: 18rem;
	padding: 0.5rem;
}
</style>
