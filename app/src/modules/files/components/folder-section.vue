<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Folder } from '@/composables/use-folders';
import Card from '@/layouts/cards/components/card.vue';

const props = defineProps<{
	subfolders: Folder[];
	anySelection?: boolean;
}>();

const selection = defineModel<string[]>('selection', { default: () => [] });

const selectMode = computed(() => selection.value.length > 0 || (props.anySelection ?? false));

const router = useRouter();

function onClick({ item, event }: { item: Record<string, any>; event: MouseEvent | KeyboardEvent }) {
	if (selectMode.value) {
		if (selection.value.includes(item.id)) {
			selection.value = selection.value.filter((id) => id !== item.id);
		} else {
			selection.value = [...selection.value, item.id];
		}
	} else {
		const route = `/files/folders/${item.id}`;
		if (event.ctrlKey || event.metaKey) window.open(router.resolve(route).href, '_blank');
		else router.push(route);
	}
}
</script>

<template>
	<Card
		v-for="folder in props.subfolders"
		:key="folder.id"
		v-model="selection"
		item-key="id"
		icon="folder"
		:item="folder"
		:select-mode="selectMode"
		@click="onClick"
	>
		<template #title>{{ folder.name }}</template>
	</Card>
</template>
