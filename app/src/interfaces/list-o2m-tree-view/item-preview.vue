<template>
	<div class="preview">
		<render-template :collection="collection" :template="template" :item="item" />
		<div class="spacer" />
		<div v-if="!disabled" class="actions">
			<v-icon v-tooltip="t('edit')" name="launch" clickable @click="editActive = true" />
			<v-icon v-tooltip="t('deselect')" name="clear" clickable @click="$emit('deselect')" />
		</div>

		<drawer-item
			v-model:active="editActive"
			:collection="collection"
			:primary-key="item[primaryKeyField] || '+'"
			:edits="item"
			:circular-field="parentField"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';
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
	emits: ['deselect', 'input'],
	setup() {
		const { t } = useI18n();

		const editActive = ref(false);
		return { t, editActive };
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
