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

/**
 * Insert date/time — parity with TinyMCE's `insertdatetime` plugin. A small popover of
 * formats; each entry drops the current date/time as plain text at the cursor. No extension and no
 * content footprint — the inserted text is just text once it lands.
 */
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

/** Insert the chosen format's current value. Exposed for unit testing without opening the menu. */
function insert(format: Format): void {
	if (!props.editor) return;
	props.editor.chain().focus().insertContent(format.build(new Date())).run();
}

defineExpose({ insert, FORMATS });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<!-- .stop keeps the "Show More" overflow panel open when this dropdown lives inside it
			     (insert group is unpinned and overflows) — matches toolbar-popover.vue -->
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
// Menu-open uses a neutral fill instead of the ghost primary tint (matches color-menu/style-list-menu).
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}

// Widen the square `icon` button so icon + caret fit (`CARET_BUTTON_WIDTH` in buttons.ts).
.toolbar-button :deep(.button.icon) {
	inline-size: 2.5rem;
	justify-content: center;
}

.datetime-caret {
	margin-inline-start: -0.125rem;
}
</style>
