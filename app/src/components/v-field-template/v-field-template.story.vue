<script setup lang="ts">
import { useFieldTree } from '@/composables/use-field-tree';
import VFieldTemplate from './v-field-template.vue';
import { ref } from 'vue';

const value = ref('');
const collection = ref('articles');
const { treeList } = useFieldTree(collection);
</script>

<template>
	<Story title="VFieldTemplate">
		<v-field-template v-model="value" :tree="treeList" />

		<template #controls>
			<HstText v-model="value" title="Value" />
			<HstText v-model="collection" title="Collection" />
		</template>
	</Story>
</template>
