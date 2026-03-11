<script setup lang="ts">
import { computed } from 'vue';
import { Folder, useFolders } from '@/composables/use-folders';
import Card from '@/layouts/cards/components/card.vue';

const props = defineProps<{
	currentFolder?: string;
	anySelection?: boolean;
}>();

const selection = defineModel<string[]>('selection', { default: () => [] });

const { folders } = useFolders();

const subfolders = computed<Folder[]>(() => {
	if (!folders.value) return [];
	return folders.value.filter((f) => (f.parent ?? null) === (props.currentFolder ?? null));
});

const selectMode = computed(() => selection.value.length > 0 || (props.anySelection ?? false));
</script>

<template>
	<Card
		v-for="folder in subfolders"
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
