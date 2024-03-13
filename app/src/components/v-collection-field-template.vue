<script setup lang="ts">
import { useFieldTree } from '@/composables/use-field-tree';
import type { Field, Relation } from '@directus/types';
import { toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	placeholder?: string | null;
	disabled?: boolean;
	collection: string | null;
	inject: {
		fields: Field[];
		relations?: Relation[];
	} | null;
}>();

defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const { collection, inject } = toRefs(props);

const { treeList, loadFieldRelations } = useFieldTree(collection, inject);
</script>

<template>
	<div class="system-display-template">
		<v-notice v-if="collection === null">
			{{ t('interfaces.system-display-template.select_a_collection') }}
		</v-notice>
		<v-field-template
			v-else
			:tree="treeList"
			:model-value="value"
			:disabled="disabled"
			:placeholder="placeholder"
			:load-path-level="loadFieldRelations"
			@update:model-value="$emit('input', $event)"
		/>
	</div>
</template>
