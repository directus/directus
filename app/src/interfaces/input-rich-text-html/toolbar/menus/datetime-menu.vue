<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useI18n } from 'vue-i18n';
import ToolbarCaret from '../toolbar-caret.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	editor: Editor | undefined;
	disabled?: boolean;
}>();

const { t } = useI18n();

const pad = (value: number) => String(value).padStart(2, '0');

interface Format {
	labelKey: string;
	build: (date: Date) => string;
}

const FORMATS: Format[] = [
	{
		labelKey: 'wysiwyg_options.insertdatetime_date',
		build: (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
	},
	{
		labelKey: 'wysiwyg_options.insertdatetime_time',
		build: (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
	},
	{
		labelKey: 'wysiwyg_options.insertdatetime_datetime',
		build: (d) =>
			`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
	},
	{
		labelKey: 'wysiwyg_options.insertdatetime_locale',
		build: (d) => d.toLocaleString(),
	},
];

function insert(format: Format): void {
	if (!props.editor) return;
	props.editor.chain().focus().insertContent(format.build(new Date())).run();
}

// exposed for tests
defineExpose({ insert, FORMATS });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<VButton
				v-tooltip="t('wysiwyg_options.insertdatetime')"
				class="datetime-button toolbar-button"
				ghost
				:active="active"
				:disabled="disabled || !editor"
				small
				icon
				@click.stop="toggle"
			>
				<VIcon name="schedule" />
				<ToolbarCaret class="datetime-caret" />
			</VButton>
		</template>
		<VList>
			<VListItem v-for="format in FORMATS" :key="format.labelKey" clickable @click="insert(format)">
				<VListItemContent>{{ t(format.labelKey) }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}

.toolbar-button :deep(.button.icon) {
	inline-size: 2.5rem;
	justify-content: center;
}

.datetime-caret {
	margin-inline-start: -0.125rem;
}
</style>
