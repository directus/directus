<script setup lang="ts">
import { computed } from 'vue';
import { Folder } from '@/composables/use-folders';
import Card from '@/layouts/cards/components/card.vue';

const props = defineProps<{
	subfolders: Folder[];
	anySelection?: boolean;
}>();

const selection = defineModel<string[]>('selection', { default: () => [] });

const selectMode = computed(() => selection.value.length > 0 || (props.anySelection ?? false));
</script>

<template>
	<Card
		v-for="folder in props.subfolders"
		:key="folder.id"
		v-model="selection"
		item-key="id"
		icon="folder"
		:item="folder"
		:to="`/files/folders/${folder.id}`"
		:select-mode="selectMode"
	>
		<template #title>{{ folder.name }}</template>
	</Card>
</template>
