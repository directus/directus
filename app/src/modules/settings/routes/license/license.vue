<script setup lang="ts">
import type { Entitlements } from '@directus/license';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import LicenseAddonItem from './components/license-addon-item.vue';
import LicenseEntitlementItem from './components/license-entitlement-item.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VChip from '@/components/v-chip.vue';
import VDialog from '@/components/v-dialog.vue';
import VDivider from '@/components/v-divider.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VList from '@/components/v-list.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import type { PendingResolution } from '@/license/types';
import sdk, { requestEndpoint } from '@/sdk';
import { useLicenseStore } from '@/stores/license';
import { formatDate } from '@/utils/format-date';
import { formatNumber } from '@/utils/format-number';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateView } from '@/views/private';

const { t, locale } = useI18n();

const licenseStore = useLicenseStore();

const { info: license, addons, loading, boundary, isLicensed } = storeToRefs(licenseStore);

const boundaryDate = computed(() => {
	if (!boundary.value || !Number.isFinite(boundary.value.timestamp)) return null;
	const dateStr = new Date(boundary.value.timestamp * 1000).toISOString().slice(0, 10);
	return formatDate(dateStr, { type: 'date', format: 'long' });
});

onMounted(() => {
	licenseStore.hydrateAddons();
});

const planDisplayName = computed(() => license.value?.type ?? null);

const addLicenseDrawer = ref(false);
const licenseKey = ref('');

type EntitlementConfig = {
	key: keyof Entitlements;
	icon: string;
	title: string;
	formatter?: (value: number) => string;
};

function formatTimeframe(seconds: number): string {
	const days = Math.floor(seconds / 86400);

	if (days % 365 === 0)
		return formatNumber(days / 365, locale.value, { style: 'unit', unit: 'year', unitDisplay: 'long' });
	if (days % 30 === 0)
		return formatNumber(days / 30, locale.value, { style: 'unit', unit: 'month', unitDisplay: 'long' });
	if (days % 7 === 0) return formatNumber(days / 7, locale.value, { style: 'unit', unit: 'week', unitDisplay: 'long' });
	return formatNumber(days, locale.value, { style: 'unit', unit: 'day', unitDisplay: 'long' });
}

const ENTITLEMENT_CONFIG: EntitlementConfig[] = [
	{ key: 'collections', icon: 'database', title: t('licensing.entitlements.collections') },
	{ key: 'seats', icon: 'people', title: t('licensing.entitlements.seats') },
	{
		key: 'activity_historical_timeframe',
		icon: 'timeline',
		title: t('licensing.entitlements.activity_historical_timeframe'),
		formatter: formatTimeframe,
	},
	{
		key: 'revision_historical_timeframe',
		icon: 'manage_history',
		title: t('licensing.entitlements.revisions_historical_timeframe'),
		formatter: formatTimeframe,
	},
	{ key: 'sso_enabled', icon: 'lock', title: t('licensing.entitlements.sso_enabled') },
	{ key: 'offline_enabled', icon: 'cloud_off', title: t('licensing.entitlements.offline_enabled') },
	{ key: 'telemetry_required', icon: 'analytics', title: t('licensing.entitlements.telemetry_required') },
	{ key: 'custom_llms_enabled', icon: 'smart_toy', title: t('licensing.entitlements.custom_llms_enabled') },
	{
		key: 'custom_policy_rules_enabled',
		icon: 'policy',
		title: t('licensing.entitlements.custom_policy_rules_enabled'),
	},
	{ key: 'production_enabled', icon: 'rocket_launch', title: t('licensing.entitlements.production_enabled') },
];

type NumericEntitlement = { limit: number; addon?: number; overage?: number };
type FeatureFlagEntitlement = { default: boolean; override?: boolean };

function isNumericEntitlement(value: unknown): value is NumericEntitlement {
	return typeof value === 'object' && value !== null && 'limit' in value;
}

function isFeatureFlagEntitlement(value: unknown): value is FeatureFlagEntitlement {
	return typeof value === 'object' && value !== null && 'default' in value;
}

function effectiveLimit(entitlement: NumericEntitlement): number {
	return entitlement.limit + (entitlement.addon ?? 0) + (entitlement.overage ?? 0);
}

function isIncluded(entitlement: FeatureFlagEntitlement): boolean {
	return entitlement.override ?? entitlement.default;
}

function usageFor(key: keyof Entitlements): number | null {
	if (!license.value) return null;
	if (key === 'seats') return license.value.usage.seats;
	if (key === 'collections') return license.value.usage.collections;
	return null;
}

const deactivateConfirmOpen = ref(false);
const deactivateLoading = ref(false);

async function handleDeactivateClick() {
	deactivateLoading.value = true;

	try {
		const assessment = await sdk.request(
			requestEndpoint<PendingResolution[]>('/license/pending-resolution', { method: 'GET' }),
		);

		if (assessment.length === 0) {
			deactivateConfirmOpen.value = true;
		} else {
			// TODO: show conflict resolution modal
		}
	} catch (err) {
		unexpectedError(err);
	} finally {
		deactivateLoading.value = false;
	}
}
</script>

<template>
	<PrivateView :title="t('settings_license')" icon="diamond">
		<template #headline>
			<VBreadcrumb :items="[{ name: t('settings'), to: '/settings' }]" />
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="license">
			<VProgressCircular v-if="loading" indeterminate />

			<template v-else-if="license">
				<div class="plan-header">
					<div class="plan-title">
						<span class="plan-name">{{ planDisplayName }}</span>
						<div class="plan-status">
							<VChip :class="license.status" x-small>{{ license.status }}</VChip>
							<span v-if="boundaryDate" class="boundary-date">
								{{
									boundary?.type === 'expiration'
										? t('licensing.expires_on', { date: boundaryDate })
										: t('licensing.renews_on', { date: boundaryDate })
								}}
							</span>
						</div>
					</div>
					<div class="plan-actions">
						<VButton v-if="!isLicensed" secondary small @click="addLicenseDrawer = true">
							{{ t('licensing.add') }}
						</VButton>
						<VButton v-if="isLicensed" secondary small @click="() => {}">{{ t('licensing.manage') }}</VButton>
						<VButton small @click="() => {}">{{ t('licensing.upgrade_plan') }}</VButton>
					</div>
				</div>
				<VDivider />

				<div class="entitlements">
					<span class="entitlements-title">{{ t('licensing.plan_usage') }}</span>
					<template v-for="item in ENTITLEMENT_CONFIG" :key="item.key">
						<LicenseEntitlementItem
							v-if="isFeatureFlagEntitlement(license.entitlements[item.key])"
							:icon="item.icon"
							:title="item.title"
							:included="isIncluded(license.entitlements[item.key] as FeatureFlagEntitlement)"
						/>
						<LicenseEntitlementItem
							v-else-if="isNumericEntitlement(license.entitlements[item.key])"
							:icon="item.icon"
							:title="item.title"
						>
							<span v-if="item.formatter" class="usage-value">
								{{ item.formatter(effectiveLimit(license.entitlements[item.key] as NumericEntitlement)) }}
							</span>
							<span v-else>
								<span class="usage-value">{{ usageFor(item.key) ?? 0 }}</span>
								<span class="limit">/ {{ effectiveLimit(license.entitlements[item.key] as NumericEntitlement) }}</span>
							</span>
						</LicenseEntitlementItem>
					</template>
				</div>

				<div class="addons">
					<div class="section-header">
						<span class="section-title">
							<VIcon name="diamond" small />
							{{ t('licensing.addons') }}
						</span>
						<VDivider />
					</div>
					<VList>
						<LicenseAddonItem v-for="addon in addons" :key="addon.id" :addon="addon" />
					</VList>
				</div>

				<div class="danger-zone">
					<div class="danger-header">
						<span class="danger-title">
							<VIcon name="emergency_home" small class="danger-icon" />
							{{ t('danger_zone') }}
						</span>
						<VDivider />
					</div>
					<VNotice v-if="license.source === 'env'" type="info">
						{{ t('licensing.env_managed') }}
					</VNotice>
					<VButton
						:disabled="license.source === 'env'"
						:loading="deactivateLoading"
						danger
						@click="handleDeactivateClick"
					>
						{{ t('licensing.deactivate') }}
					</VButton>
				</div>
			</template>
		</div>
	</PrivateView>

	<VDialog v-model="deactivateConfirmOpen" @esc="deactivateConfirmOpen = false">
		<VCard>
			<VCardTitle>{{ t('licensing.deactivate_confirm_title') }}</VCardTitle>
			<VCardText>{{ t('licensing.deactivate_confirm_body') }}</VCardText>
			<VCardActions>
				<VButton secondary @click="deactivateConfirmOpen = false">{{ t('cancel') }}</VButton>
				<VButton danger>{{ t('licensing.deactivate') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDrawer
		v-model="addLicenseDrawer"
		:title="t('licensing.key_management')"
		icon="vpn_key"
		@cancel="addLicenseDrawer = false"
	>
		<div class="drawer-content">
			<VNotice type="info">
				{{ t('licensing.key_notice') }}
			</VNotice>
			<VInput v-model="licenseKey" :placeholder="t('licensing.key')" />
		</div>
	</VDrawer>
</template>

<style scoped>
.license {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	max-inline-size: 67.5rem;
}

.plan-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-block-end: 1rem;
}

.plan-title {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.5rem;
}

.plan-status {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.boundary-date {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--theme--foreground-subdued);
}

.plan-name {
	font-size: 1.375rem;
	font-weight: var(--theme--fonts--display--font-weight);
	font-family: var(--theme--fonts--display--font-family);
	color: var(--theme--foreground-accent);
	line-height: 1;
}

.plan-actions {
	display: flex;
	gap: 0.5rem;
}

.entitlements {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.5rem;
	margin-block-start: 2.5rem;
}

.entitlements-title {
	grid-column: 1 / -1;
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--theme--foreground);
}

.usage-value {
	font-weight: 600;
}

.limit {
	color: var(--theme--foreground-subdued);
	margin-inline-start: 0.25rem;
}

.addons,
.danger-zone {
	margin-block-start: 2.5rem;
}

.section-header,
.danger-header {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-block-end: 1.5rem;
}

.section-title,
.danger-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.375rem;
	font-weight: var(--theme--fonts--display--font-weight);
	font-family: var(--theme--fonts--display--font-family);
	color: var(--theme--foreground-accent);
	line-height: 1;
}

.danger-icon {
	--v-icon-color: var(--theme--danger);
}

.drawer-content {
	display: flex;
	flex-direction: column;
	gap: 2.25rem;
	padding: var(--content-padding);
}
</style>
