<script setup lang="ts">
import { computed } from 'vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const visible = computed(() => {
	if (!serverStore.info?.license?.entitlements?.display_powered_by) return false;

	return serverStore.info?.license?.entitlements?.display_powered_by !== 'NONE';
});
</script>

<template>
	<div v-if="visible" class="wrapper">
		<hr />
		<slot />
	</div>
</template>

<style lang="scss" scoped>
.wrapper {
	padding: 0 0.6875rem 0.6565rem;
	gap: 0.6565rem;
	display: flex;
	position: relative;
	flex-direction: column;

	hr {
		flex-grow: 1;
		max-inline-size: 100%;
		border: solid;
		border-color: var(--theme--navigation--list--divider--border-color);
		border-width: var(--theme--border-width) 0 0 0;
		inline-size: calc(100% - 1.375rem);
		align-self: center;
	}
}
</style>
