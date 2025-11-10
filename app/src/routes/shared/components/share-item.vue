<script setup lang="ts">
import { useItem } from '@/composables/use-item';
import { useUserStore } from '@/stores/user';
import { toRefs } from 'vue';

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

const { collection, primaryKey } = toRefs(props);

const userStore = useUserStore();

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
		:direction="userStore.textDirection"
	/>
</template>
