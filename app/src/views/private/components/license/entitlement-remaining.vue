<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChip from '@/components/v-chip.vue';
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
	<VChip v-if="show" small :label="false" :kind="variant" class="entitlement-remaining">{{ label }}</VChip>
</template>

<style scoped lang="scss">
.entitlement-remaining {
	--v-chip-font-weight: 600;
}
</style>
