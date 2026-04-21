<script setup lang="ts">
import type { LicenseBannerState } from './types';
import VNotice from '@/components/v-notice.vue';

defineProps<{
	state: LicenseBannerState;
}>();
</script>

<template>
	<div class="banners">
		<VNotice v-if="state.errorMessage" type="danger">
			<p v-if="state.errorCode" class="error-code">{{ state.errorCode }}</p>
			<p>{{ state.errorMessage }}</p>
		</VNotice>

		<VNotice v-if="state.showExpiringSoonWarning" type="warning">
			{{ $t('license.expiring_soon_notice', { days: state.daysUntilExpiry }) }}
		</VNotice>

		<VNotice v-if="state.showExpirationGraceWarning" type="danger">
			{{ $t('license.expired_notice', { days: state.daysUntilLock }) }}
		</VNotice>

		<VNotice v-if="state.showInvalidWarning" type="warning">
			{{ $t('license.invalid_notice') }}
		</VNotice>

		<VNotice v-if="state.showLockedWarning" type="danger">
			{{ $t('license.locked_notice') }}
		</VNotice>
	</div>
</template>

<style scoped>
.banners {
	display: grid;
	gap: 1rem;
}

.error-code {
	margin: 0 0 0.25rem;
	font-weight: 600;
}
</style>
