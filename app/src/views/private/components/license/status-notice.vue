<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
import { GRACE_DANGER_THRESHOLD_DAYS, useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const { gracePeriodDaysRemaining, isLicensed } = storeToRefs(useLicenseStore());
const { isAdmin } = storeToRefs(useUserStore());

const show = computed(() => isAdmin.value && gracePeriodDaysRemaining.value !== null);

const severity = computed(() =>
	gracePeriodDaysRemaining.value !== null && gracePeriodDaysRemaining.value <= GRACE_DANGER_THRESHOLD_DAYS
		? 'danger'
		: 'warning',
);

const noticeKey = computed(() => (isLicensed.value ? 'license.status_notice' : 'license.unlicensed_status_notice'));
</script>

<template>
	<VNotice v-if="show" :type="severity" multiline class="status-notice">
		<template #title>
			<span class="message">
				{{ t(`${noticeKey}.grace_period_prefix`) }}
				<strong>
					{{ t(`${noticeKey}.grace_days`, { days: gracePeriodDaysRemaining }, gracePeriodDaysRemaining ?? 0) }}
				</strong>
				{{ t(`${noticeKey}.grace_period_suffix`) }}
			</span>
		</template>
	</VNotice>
</template>

<style scoped>
.status-notice :deep(.v-notice-title) {
	flex: 1;
}

.message {
	flex: 1;
	font-weight: normal;
	color: var(--theme--foreground);
}
</style>
