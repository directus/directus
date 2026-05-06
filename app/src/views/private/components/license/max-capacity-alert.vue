<script setup lang="ts">
import { computed, ref } from 'vue';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';

const props = withDefaults(
	defineProps<{
		entitlementKey?: 'collections' | 'seats';
	}>(),
	{ entitlementKey: 'collections' },
);

const licenseStore = useLicenseStore();

const dismissed = ref(false);

const remaining = computed(() => {
	return props.entitlementKey === 'collections' ? licenseStore.collectionsRemaining : licenseStore.seatsRemaining;
});

const isAtCapacity = computed(() => remaining.value !== null && remaining.value <= 0);

const noticeType = computed<'warning' | 'danger'>(() => (licenseStore.isEnterprise ? 'warning' : 'danger'));

const isVisible = computed(() => !dismissed.value && isAtCapacity.value);
</script>

<template>
	<VNotice
		v-if="isVisible"
		:type="noticeType"
		:icon="licenseStore.isEnterprise ? 'warning' : 'dangerous'"
		multiline
		class="max-capacity-alert"
	>
		<template #title>
			<span class="message">
				<span>
					{{
						licenseStore.isEnterprise
							? $t('license.max_capacity_alert_danger_enterprise')
							: $t('license.max_capacity_alert_danger')
					}}
				</span>
			</span>
		</template>
	</VNotice>
</template>

<style scoped>
.max-capacity-alert {
	margin-bottom: 2.25rem;
}

.max-capacity-alert :deep(.v-notice-title) {
	flex: 1;
	gap: 0.5rem;
}

.message {
	flex: 1;
}
</style>
