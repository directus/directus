<template>
	<v-notice v-if="!collectionField && !collection" type="warning">
		{{ t('collection_field_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!chosenCollection" type="warning">
		{{ t('select_a_collection') }}
	</v-notice>
	<div v-else class="system-field-tree">
		<v-checkbox-tree
			:model-value="value"
			:disabled="disabled"
			:choices="treeList"
			item-text="name"
			item-value="key"
			value-combining="exclusive"
			@update:model-value="$emit('input', $event)"
			@group-toggle="loadFieldRelations($event.value, 1)"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, inject, ref, PropType } from 'vue';
import { useFieldTree } from '@/composables/use-field-tree';

export default defineComponent({
	props: {
		collectionField: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<string[]>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		allowNone: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['input'],
	setup(props) {
		const { t } = useI18n();

		const values = inject('values', ref<Record<string, any>>({}));

		const chosenCollection = computed(() => values.value[props.collectionField] || props.collection);

		const { treeList, loadFieldRelations } = useFieldTree(chosenCollection);

		return { t, values, treeList, chosenCollection, loadFieldRelations };
	},
});
</script>

<style scoped>
.system-field-tree {
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}
</style>
