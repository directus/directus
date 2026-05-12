<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLicenseStore } from '@/stores/license';

const REMAINING_THRESHOLD = 5;

const props = withDefaults(
	defineProps<{
		entitlementKey?: 'collections' | 'flows';
	}>(),
	{ entitlementKey: 'collections' },
);

const { t } = useI18n();
const licenseStore = useLicenseStore();

const remaining = computed(() =>
	props.entitlementKey === 'flows' ? licenseStore.flowsRemaining : licenseStore.collectionsRemaining,
);

const show = computed(() => remaining.value !== null && remaining.value <= REMAINING_THRESHOLD);

const label = computed(() =>
	t(`license.${props.entitlementKey}_remaining`, { n: remaining.value }, remaining.value ?? 0),
);

const variant = computed(() => (remaining.value === 0 ? 'danger' : 'warning'));
</script>

<template>
	<span v-if="show" class="entitlement-remaining" :class="variant">
		{{ label }}
	</span>
</template>

<style scoped lang="scss">
.entitlement-remaining {
	--entitlement-remaining-size: 1.25rem;
	--entitlement-remaining-padding: 0.625rem;

	display: inline-flex;
	align-items: center;
	align-self: center;
	justify-content: center;
	block-size: var(--entitlement-remaining-size);
	padding: 0 var(--entitlement-remaining-padding);
	border-radius: 9999px;
	font-weight: 600;
	font-size: 0.8125rem;
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
