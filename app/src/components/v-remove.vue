<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { DisplayItem } from '@/composables/use-relation-multiple';

const { item, deselect, disabled } = defineProps<{
	item?: DisplayItem;
	deselect?: boolean;
	disabled?: boolean;
	button?: boolean;
}>();

const emit = defineEmits(['action']);

const { t } = useI18n();

const icon = computed(() => {
	if (item?.$type === 'deleted') return 'settings_backup_restore';
	if (deselect) return 'close';
	return 'delete';
});

const tooltip = computed(() => {
	if (disabled) return null;
	if (item?.$type === 'deleted') return t('undo_removed_item');
	if (deselect) return t('deselect');
	return t('remove_item');
});
</script>

<template>
	<v-button v-if="button" v-tooltip="tooltip" icon rounded :disabled @click.stop="emit('action')">
		<v-icon :name="icon" :disabled />
	</v-button>

	<v-icon v-else v-tooltip="tooltip" :name="icon" :disabled clickable @click.stop="emit('action')" />
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
