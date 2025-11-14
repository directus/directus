<script setup lang="ts">
import { useFieldTree } from '@/composables/use-field-tree';
import { toRefs } from 'vue';

const value = defineModel<string>();

const props = defineProps<{
	placeholder?: string | null;
	disabled?: boolean;
	collection: string | null;
}>();

const { collection } = toRefs(props);

const { treeList, loadFieldRelations } = useFieldTree(collection);
</script>

<template>
	<div class="system-display-template">
		<v-notice v-if="collection === null">
			{{ $t('interfaces.system-display-template.select_a_collection') }}
		</v-notice>
		<v-field-template
			v-else
			v-model="value"
			:tree="treeList"
			:disabled="disabled"
			:placeholder="placeholder"
			:load-path-level="loadFieldRelations"
		/>
	</div>
</template>
