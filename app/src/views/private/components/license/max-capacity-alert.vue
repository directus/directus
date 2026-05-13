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
		multiline
		class="max-capacity-alert"
	>
		<template #title>
			<span class="message">
				{{ $t('license.max_capacity.alert_danger_prefix') }}
				<RouterLink class="manage-plan-link" :to="{ name: 'settings-license' }" target="_blank">
					{{ $t('license.manage_plan') }}
				</RouterLink>
				{{ $t('license.max_capacity.alert_danger_suffix') }}
			</span>
		</template>
	</VNotice>
</template>

<style scoped>
.max-capacity-alert {
	margin-block-end: 2.25rem;
}

.max-capacity-alert :deep(.v-notice-title) {
	flex: 1;
	gap: 0.5rem;
}

.message {
	flex: 1;
	color: var(--theme--foreground);
}

.manage-plan-link {
	cursor: pointer;
	text-decoration: underline;
}
</style>
