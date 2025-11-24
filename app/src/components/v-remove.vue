<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import type { RelationM2O } from '@/composables/use-relation-m2o';
import type { RelationO2M } from '@/composables/use-relation-o2m';
import type { RelationM2M } from '@/composables/use-relation-m2m';
import type { RelationM2A } from '@/composables/use-relation-m2a';

const { itemType, itemInfo, itemIsLocal, itemEdits, deselect, disabled, confirm } = defineProps<{
	itemType?: DisplayItem['$type'];
	itemInfo?: RelationM2O | RelationO2M | RelationM2M | RelationM2A;
	itemIsLocal?: boolean;
	itemEdits?: DisplayItem;
	deselect?: boolean;
	disabled?: boolean;
	button?: boolean;
	confirm?: boolean;
}>();

const emit = defineEmits(['action']);

const { t } = useI18n();

const { needsConfirmation, confirmDelete, onConfirmDelete } = useConfirmation();

const deselectable = computed(() => deselect || itemIsLocal);

const icon = computed(() => {
	if (needsConfirmation.value) return 'delete';
	if (itemType === 'deleted') return 'settings_backup_restore';
	if (deselectable.value) return 'close';
	return 'delete';
});

const tooltip = computed(() => {
	if (disabled) return null;
	if (needsConfirmation.value) return t('remove_item');
	if (itemType === 'deleted') return t('undo_removed_item');
	if (deselectable.value) return t('deselect');
	return t('remove_item');
});

function onClick() {
	if (needsConfirmation.value) {
		confirmDelete.value = true;
		return;
	}

	emit('action');
}

function useConfirmation() {
	const confirmDelete = ref(false);

	const needsConfirmation = computed(() => {
		return confirm || hasItemEdits();
	});

	return { needsConfirmation, confirmDelete, onConfirmDelete };

	function onConfirmDelete() {
		confirmDelete.value = false;
		emit('action');
	}

	function hasItemEdits() {
		if (!itemInfo?.type || !itemEdits) return false;

		if (itemInfo.type === 'm2o') {
			return hasEdits(itemEdits, [itemInfo.relatedPrimaryKeyField.field]);
		} else {
			if (!itemIsLocal || itemType === 'deleted') return false;

			const relationField = itemInfo.relation.field;
			if (!relationField) return false;

			if (itemInfo.type === 'o2m') {
				return hasEdits(itemEdits, [itemInfo.relatedPrimaryKeyField.field, itemInfo.sortField ?? '', relationField]);
			}

			if (itemInfo.type === 'm2m') {
				const junctionHasEdits = hasEdits(itemEdits, [
					itemInfo.junction.field,
					itemInfo.junctionPrimaryKeyField.field,
					itemInfo.sortField ?? '',
					relationField,
				]);

				if (junctionHasEdits) return true;

				const edits = itemEdits[relationField];
				if (!edits) return false;

				return hasEdits(edits, [itemInfo.relatedPrimaryKeyField.field]);
			}

			if (itemInfo.type === 'm2a') {
				const junctionHasEdits = hasEdits(itemEdits, [
					itemInfo.junction.field,
					itemInfo.junctionPrimaryKeyField.field,
					itemInfo.collectionField.field,
					itemInfo.sortField ?? '',
					relationField,
				]);

				if (junctionHasEdits) return true;

				const edits = itemEdits[relationField];
				if (!edits) return false;

				const relationPK = itemInfo.relationPrimaryKeyFields[itemEdits.collection]?.field;
				if (!relationPK) return true;

				return hasEdits(edits, [relationPK]);
			}

			return false;
		}
	}

	function hasEdits(edits: DisplayItem, fieldsToExclude: string[]) {
		fieldsToExclude.push('$type', '$index', '$edits');
		return Object.keys(edits).filter((field) => !fieldsToExclude.includes(field)).length > 0;
	}
}
</script>

<template>
	<v-button
		v-if="button"
		v-prevent-focusout="confirmDelete"
		v-tooltip="tooltip"
		v-bind="$attrs"
		icon
		rounded
		:disabled
		@click.stop="onClick"
	>
		<v-icon :name="icon" :disabled />
	</v-button>

	<v-icon
		v-else
		v-prevent-focusout="confirmDelete"
		v-tooltip="tooltip"
		v-bind="$attrs"
		:name="icon"
		:disabled
		clickable
		@click.stop="onClick"
	/>

	<v-dialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="onConfirmDelete">
		<v-card>
			<v-card-title>{{ $t('batch_delete_confirm', 1) }}</v-card-title>

			<v-card-actions>
				<v-button secondary @click="confirmDelete = false">
					{{ $t('cancel') }}
				</v-button>
				<v-button kind="danger" @click="onConfirmDelete">
					{{ $t('delete_label') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-remove-color  [var(--v-icon-color)]
		--v-remove-color-hover  [var(--theme--danger)]

*/

.v-icon {
	--v-icon-color: var(--v-remove-color, var(--v-icon-color));

	&.has-click:hover,
	.v-button:hover & {
		color: var(--v-remove-color-hover, var(--theme--danger));
	}
}
</style>
