<template>
	<v-notice v-if="!collectionField && !collectionName" type="warning">
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
			@group-toggle="loadFieldRelations($event.value)"
		/>
	</div>
</template>

<script setup lang="ts">
import { useFieldTree } from '@/composables/use-field-tree';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { t } = useI18n();

const values = inject('values', ref<Record<string, any>>({}));

const chosenCollection = computed(() => values.value[props.collectionField!] || props.collectionName);

const { treeList, loadFieldRelations } = useFieldTree(chosenCollection);
</script>

<style scoped>
.system-field-tree {
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}
</style>
