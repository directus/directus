<script setup lang="ts">
import type { LicenseAddon } from '@directus/license';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import { useLicenseStore } from '@/stores/license';
import { formatDate } from '@/utils/format-date';
import { unexpectedError } from '@/utils/unexpected-error';

const props = defineProps<{
	modelValue: boolean;
	addon: LicenseAddon;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const licenseStore = useLicenseStore();

const effectiveQuantity = computed(() => props.addon.scheduled_quantity);

const initialQuantity = computed(() =>
	effectiveQuantity.value > 0 ? effectiveQuantity.value : props.addon.min_quantity,
);

const quantity = ref(initialQuantity.value);
const saving = ref(false);

watch(
	() => props.modelValue,
	(open) => {
		if (open) quantity.value = initialQuantity.value;
	},
);

const maxQuantity = computed(() => (props.addon.max_quantity === -1 ? undefined : props.addon.max_quantity));
const unitPrice = computed(() => props.addon.unit_price / 100);
const interval = computed(() => props.addon.billing_interval);
const newTotal = computed(() => quantity.value * unitPrice.value);
const hasPendingDeactivation = computed(() => props.addon.scheduled_quantity < props.addon.active_quantity);
const isRemove = computed(() => quantity.value === 0);
const isInitialPurchase = computed(() => props.addon.active_quantity === 0);
const isDowngrade = computed(() => quantity.value < props.addon.active_quantity);
const isUpgrade = computed(() => quantity.value > props.addon.active_quantity);
const hasNoChange = computed(() => quantity.value === effectiveQuantity.value);

const renewalDate = computed(() => {
	const ts = licenseStore.info?.renews_at;
	if (!ts) return null;
	const dateStr = new Date(ts * 1000).toISOString().slice(0, 10);
	return formatDate(dateStr, { type: 'date', format: 'long' });
});

const canConfirm = computed(() => {
	if (typeof quantity.value !== 'number' || Number.isNaN(quantity.value)) return false;
	if (quantity.value < 0) return false;
	if (maxQuantity.value !== undefined && quantity.value > maxQuantity.value) return false;
	return !hasNoChange.value;
});

async function confirm() {
	saving.value = true;

	try {
		await licenseStore.setAddonQuantity(props.addon.id, quantity.value);
		emit('update:modelValue', false);
	} catch (err) {
		unexpectedError(err);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		@update:model-value="emit('update:modelValue', $event)"
		@esc="emit('update:modelValue', false)"
	>
		<VCard>
			<VCardTitle>
				<div class="title-wrapper">
					<div>{{ t('licensing.addon_purchase_dialog_title', { name: addon.name }) }}</div>
					<div class="subtitle">{{ addon.description }}</div>
				</div>
			</VCardTitle>

			<VCardText>
				<VInput v-model="quantity" type="number" :min="0" :max="maxQuantity" :step="1" />

				<div class="summary">
					<template v-if="isInitialPurchase">
						{{ t('licensing.addon_summary_purchase', { new: quantity }) }}
					</template>
					<template v-else-if="hasPendingDeactivation && quantity === effectiveQuantity">
						{{
							t('licensing.addon_summary_pending', {
								active: addon.active_quantity,
								effective: effectiveQuantity,
								date: renewalDate,
							})
						}}
					</template>
					<template v-else-if="isDowngrade || isRemove">
						{{
							t('licensing.addon_summary_downgrade', {
								active: addon.active_quantity,
								new: quantity,
								difference: addon.active_quantity - quantity,
							})
						}}
					</template>
					<template v-else-if="isUpgrade">
						{{
							t('licensing.addon_summary_upgrade', {
								active: addon.active_quantity,
								new: quantity,
								difference: quantity - addon.active_quantity,
							})
						}}
					</template>
					<template v-else>
						{{ t('licensing.addon_summary_active', { active: addon.active_quantity }) }}
					</template>
				</div>

				<hr />

				<div class="price">
					{{
						t('licensing.addon_price_summary', {
							new: quantity,
							unitPrice: unitPrice.toFixed(2),
							interval,
							total: newTotal.toFixed(2),
						})
					}}
				</div>

				<p class="notice">
					<template v-if="isInitialPurchase || isUpgrade">
						{{
							t('licensing.addon_prorated_notice', {
								total: newTotal.toFixed(2),
								interval,
								adjustedTotal: (unitPrice * (quantity - addon.active_quantity)).toFixed(2),
								renewalDate,
							})
						}}
					</template>
					<template v-else>
						{{ t('licensing.addon_renewal_notice_date', { date: renewalDate }) }}
					</template>
				</p>
			</VCardText>

			<VCardActions>
				<VButton secondary :disabled="saving" @click="emit('update:modelValue', false)">
					{{ t('cancel') }}
				</VButton>
				<VButton :kind="isRemove ? 'danger' : undefined" :loading="saving" :disabled="!canConfirm" @click="confirm">
					{{ t('licensing.addon_update') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style scoped>
.title-wrapper {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.subtitle {
	color: var(--theme--foreground-subdued);
	font-size: 0.875rem;
	font-weight: 400;
}

.summary {
	margin-block-start: 1rem;
	color: var(--theme--foreground-subdued);
}

hr {
	margin-block: 1rem;
	border: 0;
	border-block-start: 1px solid var(--theme--border-color-subdued);
}

.price {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	font-size: 1rem;
}

.price-new {
	font-weight: 600;
}

.price-was {
	color: var(--theme--foreground-subdued);
	font-size: 0.875rem;
}

.notice {
	margin-block-start: 0.75rem;
	color: var(--theme--foreground-subdued);
	font-size: 0.875rem;
}
</style>
