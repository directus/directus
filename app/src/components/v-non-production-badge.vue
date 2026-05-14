<script setup lang="ts">
import { computed } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const displayPoweredBy = computed(() => serverStore.info?.license?.entitlements?.display_powered_by);
</script>

<template>
	<VChip v-if="displayPoweredBy === 'NON_PROD'" small :label="false" kind="info" class="non-production-badge">
		<VIcon name="code" small />
		{{ $t('licensing.badge.non_prod') }}
	</VChip>
</template>

<style lang="scss" scoped>
.non-production-badge {
	font-weight: 600;
	inline-size: fit-content;
	margin: 0.319rem 1rem;

	:deep(.chip-content) {
		gap: 0.25rem;
	}
}
</style>
