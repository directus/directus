<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VChip from '@/components/v-chip.vue';

const { t } = useI18n();

const props = defineProps<{
	planName: string;
	status: string | null;
	expiryText: string;
	canManageLicense: boolean;
	showManagePlan: boolean;
	managePlanLabel: string;
	managePlanHref: string;
}>();

defineEmits<{
	manageLicense: [];
}>();

const chipLabel = computed(() => {
	if (props.status === 'canceled') return t('canceled');
	if (props.status === 'expired') return t('expired');
	return t('license.current_plan');
});
</script>

<template>
	<section class="plan-section">
		<div class="plan-main">
			<div class="plan-copy">
				<h2 class="plan-title">{{ planName }}</h2>
				<div class="plan-meta">
					<VChip small class="plan-chip">{{ chipLabel }}</VChip>
					<span class="plan-expiry">{{ expiryText }}</span>
				</div>
			</div>

			<div class="plan-actions">
				<VButton secondary small :disabled="!canManageLicense" @click="$emit('manageLicense')">
					{{ $t('license.manage_license') }}
				</VButton>
				<VButton v-if="showManagePlan" small :href="managePlanHref" target="_blank">
					{{ managePlanLabel }}
				</VButton>
			</div>
		</div>
	</section>
</template>

<style scoped lang="scss">
.plan-section {
	padding-block-end: 1rem;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.plan-main {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.plan-copy {
	min-inline-size: 0;
}

.plan-title {
	margin: 0 0 0.5rem;
	font-size: 1.75rem;
	font-weight: 700;
	color: var(--theme--foreground-accent);
}

.plan-meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	color: var(--theme--foreground-subdued);
	font-size: 0.9375rem;
}

.plan-chip {
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-background);
	--v-chip-border-color: var(--theme--primary-background);
}

.plan-actions {
	display: flex;
	flex-shrink: 0;
	flex-wrap: wrap;
	gap: 0.75rem;
}

@media (width <= 56rem) {
	.plan-main {
		flex-direction: column;
		align-items: stretch;
	}

	.plan-actions {
		inline-size: 100%;
	}
}
</style>
