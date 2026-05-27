<script setup lang="ts">
import { DIRECTUS_DOMAIN } from '@directus/constants';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { I18nT } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
import { GRACE_DANGER_THRESHOLD_DAYS, useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';

const serverStore = useServerStore();
const { gracePeriodDaysRemaining, isLocked, isCoreGrace, graceDeadline } = storeToRefs(useLicenseStore());

const formattedCoreGraceDate = computed(() =>
	graceDeadline.value
		? new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(graceDeadline.value)
		: '',
);

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

const coreGraceLicensingUrl = `https://${DIRECTUS_DOMAIN}/docs/licensing/overview`;
</script>

<template>
	<VNotice v-if="show && isLocked" type="danger" multiline class="status-notice">
		<template #title>
			<span class="message">
				<I18nT keypath="license.locked_status_notice" tag="span">
					<template #contactSupport>
						<a :href="lockedSupportUrl" target="_blank" rel="noopener noreferrer">{{ $t('contact_support') }}</a>
					</template>
				</I18nT>
			</span>
		</template>
	</VNotice>
	<VNotice v-else-if="show && isCoreGrace" :type="severity" multiline class="status-notice">
		<template #title>
			<span class="message">
				{{ $t('license.unlicensed_status_notice.grace_period_prefix') }}
				<strong>
					{{
						$t(
							'license.unlicensed_status_notice.grace_days_left',
							{ days: gracePeriodDaysRemaining },
							gracePeriodDaysRemaining ?? 0,
						)
					}}
				</strong>
				{{ $t('license.unlicensed_status_notice.grace_period_middle') }}
				<strong>{{ formattedCoreGraceDate }}.</strong>
				{{ $t('license.unlicensed_status_notice.grace_period_suffix') }}
				<a :href="coreGraceLicensingUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('license.unlicensed_status_notice.retrieve_license_key') }}
				</a>
				{{ $t('license.unlicensed_status_notice.grace_period_cta_separator') }}
				<a :href="coreGraceLicensingUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('license.unlicensed_status_notice.upgrade') }}
				</a>
				{{ $t('license.unlicensed_status_notice.grace_period_cta_suffix') }}
			</span>
		</template>
	</VNotice>
	<VNotice v-else-if="show" :type="severity" multiline class="status-notice">
		<template #title>
			<span class="message">
				{{ $t('license.status_notice.grace_period_prefix') }}
				<strong>
					{{
						$t('license.status_notice.grace_days', { days: gracePeriodDaysRemaining }, gracePeriodDaysRemaining ?? 0)
					}}
				</strong>
				{{ $t('license.status_notice.grace_period_suffix') }}
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

.message a {
	color: var(--theme--primary);
	text-decoration: underline;
	transition: color var(--fast) var(--transition);
}

.message a:hover {
	color: var(--theme--foreground);
}
</style>
