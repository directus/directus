<script setup lang="ts">
import { useItem } from '@/composables/use-item';
import { toRefs } from 'vue';

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

const { collection, primaryKey } = toRefs(props);

const { edits, item, loading } = useItem(collection, primaryKey);
</script>

<template>
	<v-form
		v-model="edits"
		:collection="collection"
		:initial-values="item"
		:primary-key="primaryKey"
		disabled
		:loading="loading"
	/>
</template>
