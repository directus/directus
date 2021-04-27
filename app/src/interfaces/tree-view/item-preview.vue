<template>
	<div class="preview">
		<render-template :collection="collection" :template="template" :item="item" />
		<div class="spacer" />
		<div class="actions" v-if="!disabled">
			<v-icon v-tooltip="$t('edit')" name="launch" @click="editActive = true" />
			<v-icon v-tooltip="$t('deselect')" name="clear" @click="$emit('deselect')" />
		</div>

		<drawer-item
			:active.sync="editActive"
			:collection="collection"
			:primary-key="item[primaryKeyField] || '+'"
			:edits="item"
			:circular-field="parentField"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import DrawerItem from '@/views/private/components/drawer-item';

export default defineComponent({
	components: { DrawerItem },
	props: {
		collection: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			required: true,
		},
		item: {
			type: Object,
			required: true,
		},
		primaryKeyField: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		parentField: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const editActive = ref(false);
		return { editActive };
	},
});
</script>

<style lang="scss" scoped>
.preview {
	display: flex;

	.spacer {
		flex-grow: 1;
	}

	.actions {
		--v-icon-color: var(--foreground-subdued);
		--v-icon-color-hover: var(--foreground-normal);

		.v-icon + .v-icon {
			margin-left: 4px;
		}
	}
}
</style>
