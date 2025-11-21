<script setup lang="ts">
import { useSessionStorage } from '@vueuse/core';
import { nextTick, ref } from 'vue';
import { useSidebarStore } from '../stores/sidebar';

const sidebarStore = useSidebarStore();

const openDetail = useSessionStorage<string[]>('sidebar-open-detail', []);
const mandatory = ref(false);

sidebarStore.onCollapse(() => (openDetail.value = []));

sidebarStore.onExpand(async () => {
	// Ensures the first item in the sidebar is automatically opened whenever the sidebar opens
	mandatory.value = true;
	await nextTick();

	// Still allow the user to manually close it afterwards
	mandatory.value = false;
});
</script>

<template>
	<v-item-group v-model="openDetail" class="sidebar-detail-group" scope="sidebar-detail" :mandatory="mandatory">
		<slot />
	</v-item-group>
</template>

<style lang="scss" scoped>
.sidebar-detail-group {
	display: contents;
}
</style>
