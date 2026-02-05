<script setup lang="ts">
import { toRefs } from 'vue';
import VFieldTemplate from '@/components/v-field-template/v-field-template.vue';
import VNotice from '@/components/v-notice.vue';
import { useFieldTree } from '@/composables/use-field-tree';

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
		<VNotice v-if="collection === null">
			{{ $t('interfaces.system-display-template.select_a_collection') }}
		</VNotice>
		<VFieldTemplate
			v-else
			v-model="value"
			:tree="treeList"
			:disabled="disabled"
			:placeholder="placeholder"
			:load-path-level="loadFieldRelations"
		/>
	</div>
</template>
