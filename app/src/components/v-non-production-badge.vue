<script setup lang="ts">
import { computed } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const displayPoweredBy = computed(() => serverStore.info?.license?.entitlements?.display_powered_by);
</script>

<template>
	<template v-if="displayPoweredBy === 'NON_PROD'">
		<hr class="badge-divider" />
		<VChip small :label="false" kind="primary" class="non-production-badge">
			<VIcon name="code" small />
			{{ $t('licensing.badge.non_prod') }}
		</VChip>
	</template>
</template>

<style lang="scss" scoped>
.badge-divider {
	inline-size: calc(100% - 0.875rem);
	align-self: center;
	border: solid;
	border-color: var(--theme--navigation--list--divider--border-color);
	border-width: var(--theme--border-width) 0 0 0;
}

.non-production-badge {
	font-weight: 600;
	inline-size: fit-content;
	margin: 0.3125rem 0.4375rem;

	:deep(.chip-content) {
		gap: 0.25rem;
	}
}
</style>
