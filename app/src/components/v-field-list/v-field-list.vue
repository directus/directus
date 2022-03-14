<template>
	<v-list :mandatory="false" @toggle="loadFieldRelations($event.value)">
		<v-field-list-item
			v-for="field in treeList"
			:key="field.field"
			:field="field"
			:depth="depth"
			@add="$emit('select', $event)"
		/>
	</v-list>
</template>

<script lang="ts" setup>
import { useFieldTree } from '@/composables/use-field-tree';
import { toRefs } from 'vue';
import VFieldListItem from './v-field-list-item.vue';

interface Props {
	collection: string;
	depth?: number;
}

const props = defineProps<Props>();

const { collection } = toRefs(props);

const { treeList, loadFieldRelations } = useFieldTree(collection);

defineEmits(['select']);
</script>
