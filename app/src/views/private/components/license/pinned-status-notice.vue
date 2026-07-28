<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import VIcon from '@/components/v-icon/v-icon.vue';
import { GRACE_DANGER_THRESHOLD_DAYS, useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const { t } = useI18n();
const { gracePeriodDaysRemaining, isLocked, isCoreGrace } = storeToRefs(useLicenseStore());
const { isAdmin } = storeToRefs(useUserStore());

const show = computed(
	() => isAdmin.value && (gracePeriodDaysRemaining.value !== null || isCoreGrace.value) && !isLocked.value,
);

const severity = computed(() =>
	gracePeriodDaysRemaining.value !== null && gracePeriodDaysRemaining.value <= GRACE_DANGER_THRESHOLD_DAYS
		? 'danger'
		: 'warning',
);

const titleKey = computed(() =>
	isCoreGrace.value
		? 'license.unlicensed_pinned_status_notice.grace_period_title'
		: 'license.pinned_status_notice.grace_period_title',
);
</script>

<template>
	<div v-if="show" class="pinned-status-notice" :class="severity">
		<VIcon :name="severity === 'danger' ? 'error' : 'warning'" class="notice-icon" />
		<div class="notice-content">
			<span class="notice-title">
				{{ t(titleKey, { days: gracePeriodDaysRemaining }) }}
			</span>
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
