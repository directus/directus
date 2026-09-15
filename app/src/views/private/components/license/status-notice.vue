<script setup lang="ts">
import { DIRECTUS_LICENSING_DOCS_URL, DIRECTUS_OIG_URL, DIRECTUS_SUPPORT_URL } from '@directus/constants';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
import { GRACE_DANGER_THRESHOLD_DAYS, useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { getDirectusUrlWithUtm } from '@/utils/directus-url';

const { t } = useI18n();

const serverStore = useServerStore();

const { gracePeriodDaysRemaining, isLocked, isCoreGrace, isCore, graceDeadline, warningReason } =
	storeToRefs(useLicenseStore());

const formattedCoreGraceDate = computed(() =>
	graceDeadline.value
		? new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(graceDeadline.value)
		: '',
);

const { isAdmin } = storeToRefs(useUserStore());

const show = computed(
	() => isAdmin.value && (gracePeriodDaysRemaining.value !== null || isLocked.value || isCoreGrace.value),
);

const showOig = computed(() => isAdmin.value && isCore.value && !isLocked.value);

const warningMessage = computed(() => {
	if (warningReason.value === null) return null;

	let reason = 'generic';

	if (['invalid_key', 'activation_limit', 'binding_mismatch'].includes(warningReason.value)) {
		reason = warningReason.value;
	}

	return t(`license.warning_status_notice.${reason}`);
});

const showWarning = computed(() => isAdmin.value && warningMessage.value !== null);

const severity = computed(() =>
	gracePeriodDaysRemaining.value !== null && gracePeriodDaysRemaining.value <= GRACE_DANGER_THRESHOLD_DAYS
		? 'danger'
		: 'warning',
);

const lockedSupportUrl = computed(() =>
	getDirectusUrlWithUtm(DIRECTUS_SUPPORT_URL, serverStore.info?.version, 'status_notice_locked_contact_support_link'),
);

const coreGraceLicensingUrl = DIRECTUS_LICENSING_DOCS_URL;

const oigUrl = computed(() =>
	getDirectusUrlWithUtm(DIRECTUS_OIG_URL, serverStore.info?.version, 'status_notice_open_innovation_grant_link'),
);
</script>

<template>
	<VNotice v-if="showWarning" type="danger" class="status-notice">
		{{ warningMessage }}
	</VNotice>
	<VNotice v-if="show && isLocked" type="danger" class="status-notice">
		<I18nT keypath="license.locked_status_notice" tag="span">
			<template #contactSupport>
				<a :href="lockedSupportUrl" target="_blank" rel="noopener noreferrer">{{ $t('contact_support') }}</a>
			</template>
		</I18nT>
	</VNotice>
	<VNotice v-else-if="show && isCoreGrace" :type="severity" class="status-notice">
		<I18nT keypath="license.unlicensed_status_notice.grace_period" tag="span">
			<template #daysLeft>
				<strong>
					{{
						$t(
							'license.unlicensed_status_notice.grace_days_left',
							{ days: gracePeriodDaysRemaining },
							gracePeriodDaysRemaining ?? 0,
						)
					}}
				</strong>
			</template>
			<template #date>
				<strong>{{ formattedCoreGraceDate }}</strong>
			</template>
			<template #retrieveLicenseKey>
				<a :href="coreGraceLicensingUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('license.unlicensed_status_notice.retrieve_license_key') }}
				</a>
			</template>
			<template #upgrade>
				<a :href="coreGraceLicensingUrl" target="_blank" rel="noopener noreferrer">
					{{ $t('license.unlicensed_status_notice.upgrade') }}
				</a>
			</template>
			<template #oig>
				<a :href="oigUrl" target="_blank" rel="noopener noreferrer">{{ $t('open_innovation_grant') }}</a>
			</template>
		</I18nT>
	</VNotice>
	<VNotice v-else-if="show" :type="severity" class="status-notice">
		<I18nT keypath="license.status_notice.grace_period" tag="span">
			<template #daysLeft>
				<strong>
					{{
						$t('license.status_notice.grace_days', { days: gracePeriodDaysRemaining }, gracePeriodDaysRemaining ?? 0)
					}}
				</strong>
			</template>
		</I18nT>
	</VNotice>
	<VNotice v-if="showOig" type="info" class="status-notice" icon="workspace_premium">
		<I18nT keypath="license.unlicensed_status_notice.oig_eligible" tag="span">
			<template #oig>
				<a :href="oigUrl" target="_blank" rel="noopener noreferrer">{{ $t('open_innovation_grant') }}</a>
			</template>
		</I18nT>
	</VNotice>
</template>

<style lang="scss" scoped>
.status-notice {
	--v-notice-color: var(--theme--foreground);
	margin-block: 2.25rem 0.5rem;

	& + .status-notice {
		margin-block-start: 0.5rem;
	}

	a {
		text-decoration: underline;
		color: var(--theme--primary);
	}
}
</style>
