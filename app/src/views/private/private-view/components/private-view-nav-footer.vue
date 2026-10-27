<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';

const serverStore = useServerStore();
const { hasPinnedNotice } = storeToRefs(useLicenseStore());
const { isAdmin } = storeToRefs(useUserStore());

const hasBadge = computed(() => {
	const dpb = serverStore.info?.license?.entitlements?.display_powered_by;
	return !!dpb && dpb !== 'HIDDEN';
});

const visible = computed(() => hasBadge.value || (isAdmin.value && hasPinnedNotice.value));
</script>

<template>
	<div v-if="visible" class="wrapper">
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
}
</style>
