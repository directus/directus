<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useLicenseStore } from '@/stores/license';

const { t } = useI18n();
const { graceDays } = storeToRefs(useLicenseStore());

const show = computed(() => graceDays.value !== null);
</script>

<template>
	<div v-if="show" class="pinned-status-notice">
		<VIcon name="warning" class="notice-icon" />
		<div class="notice-content">
			<span class="notice-title">{{ t('license.pinned_status_notice.grace_period_title', { days: graceDays }) }}</span>
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
	gap: 12px;
	padding: 12px 12px 12px 16px;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-normal);
	overflow: hidden;
	font-size: 11px;
	line-height: 16px;
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

.notice-icon {
	--v-icon-size: 16px;
	--v-icon-color: var(--theme--warning);
	flex-shrink: 0;
}

.notice-content {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.notice-title {
	font-weight: 600;
	color: var(--theme--foreground);
}

.notice-body {
	font-weight: 500;
	color: var(--theme--foreground-subdued);
	text-decoration: none;
}

.notice-body:hover {
	text-decoration: underline;
}
</style>
