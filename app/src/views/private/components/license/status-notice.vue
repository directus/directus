<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';

const { t } = useI18n();
const { graceDays } = storeToRefs(useLicenseStore());

const show = computed(() => graceDays.value !== null);
</script>

<template>
	<VNotice v-if="show" type="warning" multiline class="status-notice">
		<template #title>
			<span class="message">
				{{ t('license.status_notice.grace_period_prefix') }}
				<strong>{{ t('license.status_notice.grace_days', { days: graceDays }, graceDays!) }}</strong>
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
