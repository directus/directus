<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { I18nT } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
import { GRACE_DANGER_THRESHOLD_DAYS, useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const serverStore = useServerStore();
const { gracePeriodDaysRemaining, isLocked, isCoreGrace } = storeToRefs(useLicenseStore());
const { isAdmin } = storeToRefs(useUserStore());

const show = computed(
	() => isAdmin.value && (gracePeriodDaysRemaining.value !== null || isLocked.value || isCoreGrace.value),
);

const severity = computed(() =>
	gracePeriodDaysRemaining.value !== null && gracePeriodDaysRemaining.value <= GRACE_DANGER_THRESHOLD_DAYS
		? 'danger'
		: 'warning',
);

const lockedSupportUrl = computed(
	() =>
		`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2026_05_licensing&utm_term=${serverStore.info?.version}&utm_content=status_notice_locked_contact_support_link`,
);
</script>

<template>
	<VNotice v-if="show && isLocked" type="danger" multiline class="status-notice">
		<template #title>
			<span class="message">
				<I18nT keypath="license.locked_status_notice" tag="span">
					<template #contactSupport>
						<a :href="lockedSupportUrl" target="_blank" rel="noopener noreferrer">{{ t('contact_support') }}</a>
					</template>
				</I18nT>
			</span>
		</template>
	</VNotice>
	<VNotice v-else-if="show && isCoreGrace" type="warning" multiline class="status-notice">
		<template #title>
			<span class="message">{{ t('license.unlicensed_status_notice.grace_period') }}</span>
		</template>
	</VNotice>
	<VNotice v-else-if="show" :type="severity" multiline class="status-notice">
		<template #title>
			<span class="message">
				{{ t('license.status_notice.grace_period_prefix') }}
				<strong>
					{{ t('license.status_notice.grace_days', { days: gracePeriodDaysRemaining }, gracePeriodDaysRemaining ?? 0) }}
				</strong>
				{{ t('license.status_notice.grace_period_suffix') }}
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
