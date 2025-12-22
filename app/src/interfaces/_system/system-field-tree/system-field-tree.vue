<script setup lang="ts">
import VCheckboxTree from '@/components/v-checkbox-tree/v-checkbox-tree.vue';
import VNotice from '@/components/v-notice.vue';
import { useFieldTree } from '@/composables/use-field-tree';
import { computed, inject, ref } from 'vue';

const props = defineProps<{
	collectionField?: string;
	collectionName?: string;
	value: string[] | null;
	disabled?: boolean;
	placeholder?: string;
	allowNone?: boolean;
}>();

defineEmits<{
	(e: 'input', value: string[] | null): void;
}>();

const values = inject('values', ref<Record<string, any>>({}));

const chosenCollection = computed(() => values.value[props.collectionField!] || props.collectionName);

const { treeList, loadFieldRelations } = useFieldTree(chosenCollection);
</script>

<template>
	<VNotice v-if="!collectionField && !collectionName" type="warning">
		{{ $t('collection_field_not_setup') }}
	</VNotice>
	<VNotice v-else-if="!chosenCollection" type="warning">
		{{ $t('select_a_collection') }}
	</VNotice>
	<div v-else class="system-field-tree">
		<VCheckboxTree
			:model-value="value"
			:disabled="disabled"
			:choices="treeList"
			item-text="name"
			item-value="key"
			value-combining="exclusive"
			@update:model-value="$emit('input', $event)"
			@group-toggle="loadFieldRelations($event.value)"
		/>
	</div>
</template>

<style scoped>
.system-field-tree {
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
}
</style>
