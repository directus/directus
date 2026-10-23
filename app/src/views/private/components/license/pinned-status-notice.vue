<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import VIcon from '@/components/v-icon/v-icon.vue';
import { GRACE_DANGER_THRESHOLD_DAYS, useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const { gracePeriodDaysRemaining, isLocked, isCoreGrace, activeWarning } = storeToRefs(useLicenseStore());
const { isAdmin } = storeToRefs(useUserStore());

type PinnedNotice = { key: string; severity: 'warning' | 'danger'; title: string };

const notices = computed<PinnedNotice[]>(() => {
	if (!isAdmin.value || isLocked.value) return [];

	const result: PinnedNotice[] = [];

	if (activeWarning.value) {
		result.push({
			key: 'warning',
			severity: activeWarning.value.severity,
			title: t(`license.pinned_status_notice.warning_title.${activeWarning.value.reason}`, {
				days: activeWarning.value.daysRemaining,
			}),
		});
	}

	if (gracePeriodDaysRemaining.value !== null || isCoreGrace.value) {
		result.push({
			key: 'grace',
			severity:
				gracePeriodDaysRemaining.value !== null && gracePeriodDaysRemaining.value <= GRACE_DANGER_THRESHOLD_DAYS
					? 'danger'
					: 'warning',
			title: t(
				isCoreGrace.value
					? 'license.unlicensed_pinned_status_notice.grace_period_title'
					: 'license.pinned_status_notice.grace_period_title',
				{ days: gracePeriodDaysRemaining.value },
			),
		});
	}

	return result;
});
</script>

<template>
	<div v-for="notice in notices" :key="notice.key" class="pinned-status-notice" :class="notice.severity">
		<VIcon :name="notice.severity === 'danger' ? 'error' : 'warning'" class="notice-icon" />
		<div class="notice-content">
			<span class="notice-title">{{ notice.title }}</span>
			<RouterLink :to="{ name: 'settings-license' }" class="notice-body">
				{{ t('license.pinned_status_notice.grace_period_body') }}
			</RouterLink>
		</div>
	</div>
</template>

<style scoped>
.pinned-status-notice {
	position: relative;
	margin-block-end: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem 0.75rem 0.75rem 1rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-normal);
	overflow: hidden;
	font-size: 0.625rem;
	line-height: 1rem;
}

.pinned-status-notice::before {
	content: '';
	position: absolute;
	inset-block-start: 0;
	inset-inline-start: 0;
	inline-size: 0.25rem;
	block-size: 100%;
	background-color: var(--theme--warning);
}

.pinned-status-notice.danger::before {
	background-color: var(--theme--danger);
}

.notice-icon {
	--v-icon-size: 1rem;
	--v-icon-color: var(--theme--warning);
	flex-shrink: 0;
}

.danger .notice-icon {
	--v-icon-color: var(--theme--danger);
}

.notice-content {
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
	min-inline-size: 0;
}

.notice-title {
	font-weight: 600;
	color: var(--theme--foreground);
	text-wrap: balance;
}

.notice-body {
	font-weight: 500;
	text-decoration: none;
	text-wrap: balance;
}

.notice-body:hover {
	text-decoration: underline;
}
</style>
