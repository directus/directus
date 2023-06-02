<script setup lang="ts">
import { computed } from 'vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const name = computed(() => serverStore.info?.project?.project_name);
const descriptor = computed(() => serverStore.info?.project?.project_descriptor);
</script>

<template>
	<div class="name-container">
		<v-text-overflow placement="right" class="name" :text="name" />
		<v-text-overflow v-if="descriptor" placement="right" class="descriptor" :text="descriptor" />
	</div>
</template>

<style scoped>
.descriptor {
	display: block;
	color: var(--foreground-subdued);
}
</style>
