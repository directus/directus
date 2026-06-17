<script setup lang="ts">
import { type CountableEntitlementKey } from '@directus/license';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChip from '@/components/v-chip.vue';
import { useLicenseStore } from '@/stores/license';

const REMAINING_THRESHOLD = 5;

const props = withDefaults(
	defineProps<{
		entitlementKey?: CountableEntitlementKey;
	}>(),
	{ entitlementKey: 'collections' },
);

const { t } = useI18n();
const licenseStore = useLicenseStore();

const limit = computed(() => licenseStore.limits[props.entitlementKey]);

const show = computed(() => limit.value.remaining !== null && limit.value.remaining <= REMAINING_THRESHOLD);

const label = computed(() =>
	t(`license.${props.entitlementKey}_remaining`, { n: limit.value.remaining }, limit.value.remaining ?? 0),
);

const variant = computed(() => (limit.value.remaining !== null && limit.value.remaining <= 0 ? 'danger' : 'warning'));
</script>

<template>
	<VChip v-if="show" small :label="false" :kind="variant" class="entitlement-remaining">{{ label }}</VChip>
</template>

<style scoped lang="scss">
.entitlement-remaining {
	--v-chip-font-weight: 600;
}
</style>
