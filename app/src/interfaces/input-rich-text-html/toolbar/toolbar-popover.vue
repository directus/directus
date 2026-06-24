<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toolbarButtons, type ToolbarContext } from './buttons';
import type { RenderGroup } from './compute-toolbar-layout';
import ToolbarButtonComp from './toolbar-button.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	group: RenderGroup;
	editor: Editor | undefined;
	context: ToolbarContext;
	disabled?: boolean;
}>();

const { t } = useI18n();

const active = ref(false);

const buttons = computed(() =>
	props.group.keys.map((key) => ({ key, button: toolbarButtons[key]! })).filter((b) => b.button),
);

const firstChild = computed(() => buttons.value[0]?.button);

const activeChild = computed(() => {
	const e = props.editor;
	if (e) return buttons.value.find(({ button }) => button.isActive?.(e, props.context))?.button;
	return undefined;
});

const triggerIcon = computed(() => activeChild.value?.icon ?? props.group.icon ?? firstChild.value?.icon ?? '');

const triggerLabel = computed(() => {
	const btn = activeChild.value ?? firstChild.value;
	return btn ? t(btn.label) : '';
});
</script>

<template>
	<VMenu v-model="active" placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<!-- .stop keeps a parent menu (the "Show More" overflow panel) open when this lives inside it -->
			<VButton
				v-tooltip="triggerLabel"
				class="toolbar-button toolbar-popover"
				ghost
				:active="active"
				:disabled="disabled || !editor"
				small
				icon
				@click.stop="toggle"
			>
				<VIcon :name="triggerIcon" />
				<VIcon class="toolbar-popover-caret" name="expand_more" small />
			</VButton>
		</template>
		<div class="toolbar-popover-items">
			<ToolbarButtonComp
				v-for="item in buttons"
				:key="item.key"
				:button="item.button"
				:editor="editor"
				:context="context"
				:disabled="disabled"
				tooltip-placement="bottom"
			/>
		</div>
	</VMenu>
</template>

<style lang="scss" scoped>
.toolbar-popover-caret {
	margin-inline-start: -0.125rem;

	--v-icon-size: 1rem;
}

.toolbar-popover-items {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	padding: 0.25rem;
}
</style>
