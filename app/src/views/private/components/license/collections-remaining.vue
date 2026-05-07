<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLicenseStore } from '@/stores/license';

const COLLECTIONS_REMAINING_THRESHOLD = 5;

const { t } = useI18n();
const licenseStore = useLicenseStore();

const show = computed(
	() =>
		licenseStore.collectionsRemaining !== null && licenseStore.collectionsRemaining <= COLLECTIONS_REMAINING_THRESHOLD,
);

const label = computed(() =>
	t('license.collections_remaining', { n: licenseStore.collectionsRemaining }, licenseStore.collectionsRemaining ?? 0),
);

const variant = computed(() => (licenseStore.collectionsRemaining === 0 ? 'danger' : 'warning'));
</script>

<template>
	<span v-if="show" class="collections-remaining" :class="variant">
		{{ label }}
	</span>
</template>

<style scoped lang="scss">
.collections-remaining {
	display: inline-flex;
	align-items: center;
	align-self: center;
	justify-content: center;
	height: 1.25rem;
	padding: 0 0.625rem;
	border-radius: 9999px;
	font-weight: 600;
	font-size: 0.8125rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	flex-shrink: 0;

	&.warning {
		background: var(--theme--warning-background);
		color: var(--theme--warning-accent);
	}

	&.danger {
		background: var(--theme--danger-background);
		color: var(--theme--danger-accent);
	}
}
</style>
