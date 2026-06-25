<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';

const props = defineProps<{
	editor: Editor | undefined;
	disabled?: boolean;
}>();

const { t } = useI18n();

/** Exposed for unit testing without opening the menu. */
function run(command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>): void {
	const editor = props.editor;
	if (editor) command(editor.chain().focus()).run();
}

function insertTable(): void {
	run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
}

function inTable(): boolean {
	return props.editor?.isActive('table') ?? false;
}

function canMerge(): boolean {
	return props.editor?.can().mergeCells() ?? false;
}

function canSplit(): boolean {
	return props.editor?.can().splitCell() ?? false;
}

defineExpose({ run, insertTable });
</script>

<template>
	<VMenu placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<!-- .stop keeps a parent menu (the "Show More" overflow panel) open when this lives inside it -->
			<VButton
				v-tooltip="t('wysiwyg_options.table')"
				class="toolbar-button"
				ghost
				:active="active || inTable()"
				:disabled="disabled || !editor"
				small
				icon
				@click.stop="toggle"
			>
				<VIcon name="grid_on" />
			</VButton>
		</template>
		<VList>
			<VListItem clickable @click="insertTable">
				<VListItemIcon><VIcon name="grid_on" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_insert') }}</VListItemContent>
			</VListItem>

			<VDivider />

			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addRowBefore())">
				<VListItemIcon><VIcon name="add_row_above" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_add_row_before') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addRowAfter())">
				<VListItemIcon><VIcon name="add_row_below" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_add_row_after') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addColumnBefore())">
				<VListItemIcon><VIcon name="add_column_left" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_add_column_before') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addColumnAfter())">
				<VListItemIcon><VIcon name="add_column_right" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_add_column_after') }}</VListItemContent>
			</VListItem>

			<VDivider />

			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.toggleHeaderRow())">
				<VListItemIcon><VIcon name="table_rows" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_toggle_header_row') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.toggleHeaderColumn())">
				<VListItemIcon><VIcon name="view_column" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_toggle_header_column') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!canMerge()" @click="run((c) => c.mergeCells())">
				<VListItemIcon><VIcon name="cell_merge" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_merge_cells') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!canSplit()" @click="run((c) => c.splitCell())">
				<VListItemIcon><VIcon name="splitscreen" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_split_cell') }}</VListItemContent>
			</VListItem>

			<VDivider />

			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.deleteRow())">
				<VListItemIcon><VIcon name="delete" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_delete_row') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.deleteColumn())">
				<VListItemIcon><VIcon name="delete" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_delete_column') }}</VListItemContent>
			</VListItem>
			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.deleteTable())">
				<VListItemIcon><VIcon name="grid_off" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_delete') }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
// `.ghost` raises specificity above VButton's own `.ghost.active` rule. Mirrors style-list-menu.
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}
</style>
