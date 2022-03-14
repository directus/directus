<template>
	<v-list :mandatory="false" @toggle="loadFieldRelations($event.value)">
		<v-field-list-item
			v-for="field in treeList"
			:key="field.field"
			:field="field"
			:depth="depth"
			@add="$emit('select-field', $event)"
		/>
	</v-list>
</template>

<script lang="ts" setup>
import { useFieldTree } from '@/composables/use-field-tree';
import { computed, toRefs } from 'vue';
import VFieldListItem from './v-field-list-item.vue';

interface Props {
	collection: string;
	depth?: number;
	disabledFields?: string[];
}

const props = defineProps<Props>();

const { collection } = toRefs(props);

const { treeList: treeListOriginal, loadFieldRelations } = useFieldTree(collection);

const treeList = computed(() => {
	return treeListOriginal.value.map(setDisabled);

	function setDisabled(
		field: typeof treeListOriginal.value[number]
	): typeof treeListOriginal.value[number] & { disabled: boolean } {
		let disabled = false;

		if (props.disabledFields?.includes(field.key)) disabled = true;

		return {
			...field,
			disabled,
			children: field.children?.map(setDisabled),
		};
	}
});

defineEmits(['select-field']);
</script>
