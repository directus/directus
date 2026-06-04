<script setup lang="ts">
import { type CountableEntitlementKey } from '@directus/license';
import { RouterLink } from 'vue-router';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';

const props = withDefaults(
	defineProps<{
		entitlementKey?: CountableEntitlementKey;
	}>(),
	{ entitlementKey: 'collections' },
);

const licenseStore = useLicenseStore();
</script>

<template>
	<VNotice
		v-if="!licenseStore.limits[props.entitlementKey].hasRemaining"
		type="danger"
		icon="dangerous"
		class="max-capacity-alert"
	>
		{{ $t('license.max_capacity.alert_danger_prefix') }}
		<RouterLink class="manage-plan-link" :to="{ name: 'settings-license' }" target="_blank">
			{{ $t('license.manage_plan') }}
		</RouterLink>
		{{ $t('license.max_capacity.alert_danger_suffix') }}
	</VNotice>
</template>

<style scoped>
.max-capacity-alert {
	--v-notice-color: var(--theme--foreground);

	margin-block-end: var(--content-padding);
}

.manage-plan-link {
	cursor: pointer;
	text-decoration: underline;
	color: var(--theme--primary);
}
</style>
