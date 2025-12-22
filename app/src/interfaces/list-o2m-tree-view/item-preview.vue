<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VRemove from '@/components/v-remove.vue';
import { RelationO2M } from '@/composables/use-relation-o2m';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import RenderTemplate from '@/views/private/components/render-template.vue';
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		collection: string;
		template: string;
		item: Record<string, any>;
		edits: Record<string, any>;
		relationInfo: RelationO2M;
		disabled?: boolean;
		nonEditable?: boolean;
		open?: boolean;
		deleted: boolean;
		isLocalItem: boolean;
	}>(),
	{
		disabled: false,
		nonEditable: false,
		open: false,
	},
);

const emit = defineEmits(['update:open', 'deselect', 'input']);
const editActive = ref(false);
</script>

<template>
	<div class="preview" :class="{ open, deleted }">
		<VIcon
			v-if="relationInfo.relatedPrimaryKeyField.field in item"
			:name="props.open ? 'expand_more' : 'chevron_right'"
			clickable
			@click="emit('update:open', !props.open)"
		/>

		<RenderTemplate :collection="collection" :template="template" :item="item" />

		<div class="spacer" />

		<div class="item-actions">
			<VIcon v-tooltip="$t('edit_item')" name="edit" clickable @click="editActive = true" />

			<VRemove
				v-if="!disabled"
				:item-type="item.$type"
				:item-info="relationInfo"
				:item-is-local="isLocalItem"
				:item-edits="edits"
				@action="$emit('deselect')"
			/>
		</div>

		<DrawerItem
			v-model:active="editActive"
			:disabled
			:non-editable
			:collection="collection"
			:primary-key="item[props.relationInfo.relatedPrimaryKeyField.field] || '+'"
			:edits="edits"
			:circular-field="props.relationInfo.reverseJunctionField.field"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.preview {
	display: flex;
	block-size: var(--theme--form--field--input--height);
	align-items: center;

	.spacer {
		flex-grow: 1;
	}

	.row &.deleted {
		color: var(--theme--danger);
		background-color: var(--danger-10);
		border-color: var(--danger-25);

		&:hover {
			background-color: var(--danger-25);
			border-color: var(--danger-50);
		}

		.item-actions .v-icon {
			--v-icon-color: var(--danger-75);
			--v-icon-color-hover: var(--theme--danger);
		}
	}
}

.item-actions {
	@include mixins.list-interface-item-actions;
}
</style>
