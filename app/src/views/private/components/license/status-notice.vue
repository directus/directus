<script setup lang="ts">
import { DIRECTUS_DOMAIN } from '@directus/constants';
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
		`https://${DIRECTUS_DOMAIN}/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2026_05_licensing&utm_term=${serverStore.info?.version}&utm_content=status_notice_locked_contact_support_link`,
);
</script>

<template>
	<VNotice v-if="show && isLocked" type="danger" class="status-notice">
		<I18nT keypath="license.locked_status_notice" tag="span">
			<template #contactSupport>
				<a :href="lockedSupportUrl" target="_blank" rel="noopener noreferrer">{{ t('contact_support') }}</a>
			</template>
		</I18nT>
	</VNotice>
	<VNotice v-else-if="show && isCoreGrace" type="warning" class="status-notice">
		{{ t('license.unlicensed_status_notice.grace_period') }}
	</VNotice>
	<VNotice v-else-if="show" :type="severity" class="status-notice">
		{{ t('license.status_notice.grace_period_prefix') }}
		<strong>
			{{ t('license.status_notice.grace_days', { days: gracePeriodDaysRemaining }, gracePeriodDaysRemaining ?? 0) }}
		</strong>
		{{ t('license.status_notice.grace_period_suffix') }}
	</VNotice>
</template>

<style lang="scss" scoped>
.status-notice {
	--v-notice-color: var(--theme--foreground);

	a {
		text-decoration: underline;
		color: var(--theme--primary);
	}
}
</style>
