<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ToolbarCaret from '../toolbar-caret.vue';
import SubmenuListItem from './submenu-list-item.vue';
import { run as runTableCommand } from './table-actions';
import TableGridPicker from './table-grid-picker.vue';
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

const menuOpen = ref(false);

function run(command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>): void {
	runTableCommand(props.editor, command);
	menuOpen.value = false;
}

function insertTable(rows = 3, cols = 3): void {
	run((c) => c.insertTable({ rows, cols, withHeaderRow: false }));
}

function onPickSize({ rows, cols }: { rows: number; cols: number }): void {
	insertTable(rows, cols);
	menuOpen.value = false;
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

defineExpose({ run, insertTable, menuOpen });
</script>

<template>
	<VMenu v-model="menuOpen" placement="bottom-start" show-arrow close-on-content-click>
		<template #activator="{ toggle, active }">
			<VButton
				v-tooltip="t('wysiwyg_options.table')"
				class="toolbar-button toolbar-popover"
				ghost
				:active="active || inTable()"
				:disabled="disabled || !editor"
				small
				icon
				@click.stop="toggle"
			>
				<VIcon name="table" />
				<ToolbarCaret class="toolbar-popover-caret" />
			</VButton>
		</template>
		<VList>
			<SubmenuListItem icon="table" :label="t('wysiwyg_options.table')">
				<TableGridPicker @select="onPickSize" />
			</SubmenuListItem>

			<VDivider />

			<SubmenuListItem icon="grid_3x3" :label="t('wysiwyg_options.table_cell')" :disabled="!inTable()">
				<VListItem clickable :disabled="!canMerge()" @click="run((c) => c.mergeCells())">
					<VListItemIcon><VIcon name="cell_merge" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_merge_cells') }}</VListItemContent>
				</VListItem>
				<VListItem clickable :disabled="!canSplit()" @click="run((c) => c.splitCell())">
					<VListItemIcon><VIcon name="splitscreen" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_split_cell') }}</VListItemContent>
				</VListItem>
			</SubmenuListItem>

			<SubmenuListItem icon="table_rows" :label="t('wysiwyg_options.table_row')" :disabled="!inTable()">
				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addRowBefore())">
					<VListItemIcon><VIcon name="add_row_above" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_add_row_before') }}</VListItemContent>
				</VListItem>
				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addRowAfter())">
					<VListItemIcon><VIcon name="add_row_below" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_add_row_after') }}</VListItemContent>
				</VListItem>

				<VDivider />

				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.toggleHeaderRow())">
					<VListItemIcon><VIcon name="table_rows" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_toggle_header_row') }}</VListItemContent>
				</VListItem>

				<VDivider />

				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.deleteRow())">
					<VListItemIcon><VIcon name="delete_row" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_delete_row') }}</VListItemContent>
				</VListItem>
			</SubmenuListItem>

			<SubmenuListItem icon="view_column" :label="t('wysiwyg_options.table_column')" :disabled="!inTable()">
				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addColumnBefore())">
					<VListItemIcon><VIcon name="add_column_left" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_add_column_before') }}</VListItemContent>
				</VListItem>
				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.addColumnAfter())">
					<VListItemIcon><VIcon name="add_column_right" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_add_column_after') }}</VListItemContent>
				</VListItem>

				<VDivider />

				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.toggleHeaderColumn())">
					<VListItemIcon><VIcon name="view_column" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_toggle_header_column') }}</VListItemContent>
				</VListItem>

				<VDivider />

				<VListItem clickable :disabled="!inTable()" @click="run((c) => c.deleteColumn())">
					<VListItemIcon><VIcon name="delete_column" /></VListItemIcon>
					<VListItemContent>{{ t('wysiwyg_options.table_delete_column') }}</VListItemContent>
				</VListItem>
			</SubmenuListItem>

			<VDivider />

			<VListItem clickable :disabled="!inTable()" @click="run((c) => c.deleteTable())">
				<VListItemIcon><VIcon name="delete_table" /></VListItemIcon>
				<VListItemContent>{{ t('wysiwyg_options.table_delete') }}</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.toolbar-button.ghost.active {
	--v-button-background-color: var(--theme--form--field--input--border-color);
	--v-button-color: var(--theme--foreground);
}

.toolbar-popover :deep(.button.icon) {
	inline-size: 2.5rem;
	justify-content: center;
}

.toolbar-popover-caret {
	margin-inline-start: -0.125rem;
}
</style>
