<script setup lang="ts">
import { deactivateLicense, type Entitlements } from '@directus/license';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import LicenseAddonItem from './components/license-addon-item.vue';
import LicenseEntitlementItem from './components/license-entitlement-item.vue';
import LicenseResolutionDialog from './components/license-resolution-dialog.vue';
import LicenseSection from './components/license-section.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VChip from '@/components/v-chip.vue';
import VDialog from '@/components/v-dialog.vue';
import VDivider from '@/components/v-divider.vue';
import VDrawer from '@/components/v-drawer.vue';
import VList from '@/components/v-list.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import SystemLicenseKey from '@/interfaces/_system/system-license-key/system-license-key.vue';
import sdk from '@/sdk';
import { useLicenseStore } from '@/stores/license';
import { formatDate } from '@/utils/format-date';
import { formatTimeframe } from '@/utils/format-timeframe';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateView } from '@/views/private';

const { t } = useI18n();

const licenseStore = useLicenseStore();

const { info: license, addons, loading, boundary, isLicensed } = storeToRefs(licenseStore);

const boundaryDate = computed(() => {
	if (!boundary.value || !Number.isFinite(boundary.value.timestamp) || boundary.value.timestamp === -1) return null;
	const dateStr = new Date(boundary.value.timestamp * 1000).toISOString().slice(0, 10);
	return formatDate(dateStr, { type: 'date', format: 'long' });
});

onMounted(async () => {
	await licenseStore.hydrate();

	// Core tier has no addons (source === null), skip the request.
	if (licenseStore.info?.source != null) {
		licenseStore.hydrateAddons();
	}
});

const planDisplayName = computed(() => license.value?.name ?? null);

type ChipKind = 'primary' | 'neutral' | 'warning' | 'danger';

const statusChip = computed<{ label: string; kind: ChipKind } | null>(() => {
	if (!license.value) return null;
	if (license.value.source === null) return { label: t('licensing.unlicensed'), kind: 'neutral' };

	switch (license.value.status) {
		case 'grace':
			return { label: t('licensing.grace_period'), kind: 'warning' };
		case 'expired':
			return { label: t('licensing.expired'), kind: 'danger' };
		case 'suspended':
			return { label: t('licensing.suspended'), kind: 'danger' };
		case 'canceled':
			return { label: t('licensing.canceled'), kind: 'danger' };
		case 'locked':
			return { label: t('licensing.locked'), kind: 'danger' };
		default:
			return { label: t('licensing.current_plan'), kind: 'primary' };
	}
});

const addLicenseDrawer = ref(false);
const licenseKey = ref('');
const activateLoading = ref(false);
const licenseKeyValidity = ref<{ valid: boolean; validating: boolean }>({ valid: false, validating: false });

const canSave = computed(() => licenseKeyValidity.value.valid && !licenseKeyValidity.value.validating);

function resetAddLicenseForm() {
	licenseKey.value = '';
	licenseKeyValidity.value = { valid: false, validating: false };
}

async function handleActivate() {
	if (!canSave.value || activateLoading.value) return;

	activateLoading.value = true;

	const key = licenseKey.value.trim();

	try {
		if (isLicensed.value) {
			await licenseStore.update(key);
		} else {
			await licenseStore.activate(key);
		}

		addLicenseDrawer.value = false;
		resetAddLicenseForm();
	} catch (err) {
		unexpectedError(err);
	} finally {
		activateLoading.value = false;
	}
}

function handleAddLicenseCancel() {
	addLicenseDrawer.value = false;
	resetAddLicenseForm();
}

type EntitlementConfig = {
	key: keyof Entitlements;
	icon: string;
	title: string;
	formatter?: (value: number) => string;
};

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
const resolutionDialogOpen = ref(false);

async function handleDeactivateClick() {
	deactivateLoading.value = true;

	try {
		await licenseStore.hydratePendingResolution();

		if ((licenseStore.pendingResolution?.length ?? 0) === 0) {
			deactivateConfirmOpen.value = true;
		} else {
			resolutionDialogOpen.value = true;
		}
	} catch (err) {
		unexpectedError(err);
	} finally {
		deactivateLoading.value = false;
	}
}

function handleResolutionConfirm() {
	resolutionDialogOpen.value = false;
	deactivateConfirmOpen.value = true;
}

async function handleDeactivateConfirm() {
	deactivateLoading.value = true;

	try {
		await sdk.request(deactivateLicense());
		await licenseStore.hydrate();
		deactivateConfirmOpen.value = false;
	} catch (err) {
		unexpectedError(err);
	} finally {
		deactivateLoading.value = false;
	}
}
</script>

<template>
	<PrivateView :title="t('settings_license')" icon="diamond">
		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="license">
			<VProgressCircular v-if="loading && !license" indeterminate />

			<template v-else-if="license">
				<div class="plan-header">
					<div class="plan-title">
						<span class="plan-name">{{ planDisplayName }}</span>
						<div class="plan-status">
							<VChip v-if="statusChip" :kind="statusChip.kind" x-small>{{ statusChip.label }}</VChip>
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
						<VButton v-if="isLicensed && license.source !== null" secondary small @click="addLicenseDrawer = true">
							{{ t('licensing.manage') }}
						</VButton>
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

				<LicenseSection v-if="addons && addons.length > 0" icon="diamond" :title="t('licensing.addons')">
					<VList>
						<LicenseAddonItem v-for="addon in addons" :key="addon.id" :addon="addon" />
					</VList>
				</LicenseSection>

				<LicenseSection v-if="license.source !== null" icon="emergency_home" :title="t('danger_zone')" variant="danger">
					<div class="danger-zone-content">
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
				</LicenseSection>
			</template>
		</div>
	</PrivateView>

	<LicenseResolutionDialog v-model="resolutionDialogOpen" @confirm="handleResolutionConfirm" />

	<VDialog v-model="deactivateConfirmOpen" @esc="deactivateConfirmOpen = false">
		<VCard>
			<VCardTitle>{{ t('licensing.deactivate_confirm_title') }}</VCardTitle>
			<VCardText>{{ t('licensing.deactivate_confirm_body') }}</VCardText>
			<VCardActions>
				<VButton secondary :disabled="deactivateLoading" @click="deactivateConfirmOpen = false">
					{{ t('cancel') }}
				</VButton>
				<VButton danger :loading="deactivateLoading" @click="handleDeactivateConfirm">
					{{ t('licensing.deactivate') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>

	<VDrawer
		v-model="addLicenseDrawer"
		:title="t('licensing.key_management')"
		icon="vpn_key"
		@cancel="handleAddLicenseCancel"
		@apply="handleActivate"
	>
		<template #actions>
			<VButton
				v-tooltip.bottom="t('save')"
				small
				:disabled="!canSave"
				:loading="activateLoading"
				@click="handleActivate"
			>
				{{ t('save') }}
			</VButton>
		</template>

		<div class="drawer-content">
			<VNotice type="info">
				<I18nT keypath="setup_license_key_notice" tag="span">
					<template #oig>
						<a href="https://directus.io/license-request" target="_blank" rel="noopener noreferrer">
							{{ t('open_innovation_grant') }}
						</a>
					</template>
				</I18nT>
			</VNotice>
			<div class="license-key-field">
				<label class="type-label">{{ t('licensing.key') }}</label>
				<SystemLicenseKey
					:value="licenseKey"
					:edit="isLicensed"
					@input="licenseKey = $event ?? ''"
					@validity="licenseKeyValidity = $event"
				/>
			</div>
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

.danger-zone-content {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 1rem;
}

.drawer-content {
	display: flex;
	flex-direction: column;
	gap: 2.25rem;
	padding: var(--content-padding);
}

.license-key-field {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
</style>
