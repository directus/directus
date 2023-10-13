<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { RelationO2M } from '@/composables/use-relation-o2m';
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		collection: string;
		template: string;
		item: Record<string, any>;
		edits: Record<string, any>;
		relationInfo: RelationO2M;
		disabled?: boolean;
		open?: boolean;
		deleted: boolean;
		deleteIcon: string;
	}>(),
	{
		disabled: false,
		open: false,
	}
);

const { t } = useI18n();
const emit = defineEmits(['update:open', 'deselect', 'input']);
const editActive = ref(false);
</script>

<template>
	<div class="preview" :class="{ open, deleted }">
		<v-icon
			v-if="relationInfo.relatedPrimaryKeyField.field in item"
			:name="props.open ? 'expand_less' : 'expand_more'"
			clickable
			@click="emit('update:open', !props.open)"
		/>
		<render-template :collection="collection" :template="template" :item="item" />
		<div class="spacer" />
		<div v-if="!disabled" class="actions">
			<v-icon v-tooltip="t('edit')" name="launch" clickable @click="editActive = true" />
			<v-icon v-tooltip="t('deselect')" :name="deleteIcon" class="deselect" clickable @click="$emit('deselect')" />
		</div>

		<drawer-item
			v-model:active="editActive"
			:collection="collection"
			:primary-key="item[props.relationInfo.relatedPrimaryKeyField.field] || '+'"
			:edits="edits"
			:circular-field="props.relationInfo.reverseJunctionField.field"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<style lang="scss" scoped>
div.preview {
	display: flex;

	&:not(.open) {
		margin-bottom: 12px;
	}

	.spacer {
		flex-grow: 1;
	}

	.actions {
		--v-icon-color: var(--theme--form--field--input--foreground-subdued);
		--v-icon-color-hover: var(--theme--form--field--input--foreground);

		.v-icon + .v-icon {
			margin-left: 4px;
		}

		.deselect {
			--v-icon-color-hover: var(--theme--danger);
		}
	}

	&.deleted {
		color: var(--theme--danger);
		background-color: var(--danger-10);

		.actions {
			--v-icon-color: var(--danger-50);
			--v-icon-color-hover: var(--theme--danger);
		}
	}
}
</style>
