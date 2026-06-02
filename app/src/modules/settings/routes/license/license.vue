<script setup lang="ts">
import { DIRECTUS_OIG_URL, DIRECTUS_PRICING_URL } from '@directus/constants';
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
import { useServerStore } from '@/stores/server';
import { getDirectusUrlWithUtm } from '@/utils/directus-url';
import { formatDate } from '@/utils/format-date';
import { formatTimeframe } from '@/utils/format-timeframe';
import { getRootPath } from '@/utils/get-root-path';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateView } from '@/views/private';
import StatusNotice from '@/views/private/components/license/status-notice.vue';

const { t } = useI18n();

const licenseStore = useLicenseStore();
const serverStore = useServerStore();

const { info: license, addons, loading, boundary, isLicensed } = storeToRefs(licenseStore);

const isEnvManaged = computed(() => license.value?.source === 'env');

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

		if (licenseStore.info?.source != null) {
			await licenseStore.hydrateAddons();
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
	invert?: boolean;
};

const ENTITLEMENT_CONFIG: EntitlementConfig[] = [
	{ key: 'collections', icon: 'database', title: t('licensing.entitlements.collections') },
	{ key: 'seats', icon: 'people', title: t('licensing.entitlements.seats') },
	{ key: 'flows', icon: 'bolt', title: t('licensing.entitlements.flows') },
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
	{ key: 'telemetry_required', icon: 'analytics', title: t('licensing.entitlements.telemetry_opt_out'), invert: true },
	{ key: 'custom_llms_enabled', icon: 'smart_toy', title: t('licensing.entitlements.custom_llms_enabled') },
	{
		key: 'custom_permission_rules_enabled',
		icon: 'policy',
		title: t('licensing.entitlements.custom_permission_rules_enabled'),
	},
	{ key: 'ai_translations_enabled', icon: 'translate', title: t('licensing.entitlements.ai_translations_enabled') },
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
	if (key === 'flows') return license.value.usage.flows;
	return null;
}

type EntitlementItem =
	| (EntitlementConfig & { kind: 'flag'; included: boolean })
	| (EntitlementConfig & { kind: 'numeric'; limit: number; unlimited: boolean; usage: number | null });

const entitlementItems = computed<EntitlementItem[]>(() => {
	if (!license.value) return [];

	const items: EntitlementItem[] = [];

	for (const config of ENTITLEMENT_CONFIG) {
		const ent = license.value.entitlements[config.key];

		if (isFeatureFlagEntitlement(ent)) {
			const included = isIncluded(ent);
			items.push({ ...config, kind: 'flag', included: config.invert ? !included : included });
		} else if (isNumericEntitlement(ent)) {
			const limit = effectiveLimit(ent);
			items.push({ ...config, kind: 'numeric', limit, unlimited: limit === -1, usage: usageFor(config.key) });
		}
	}

	return items;
});

const deactivateConfirmOpen = ref(false);
const deactivateLoading = ref(false);
const resolutionDialogOpen = ref(false);

async function handleDeactivateClick() {
	deactivateLoading.value = true;

	try {
		await licenseStore.hydratePendingResolution({ license_key: null });

		if ((licenseStore.pendingResolution?.length ?? 0) === 0 && !licenseStore.aiTranslationsEnabled) {
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
		await licenseStore.hydrateAddons();
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
							<VChip v-if="license.source === null" class="status-chip" x-small :label="false">
								{{ t('licensing.unlicensed') }}
							</VChip>
							<VChip v-else class="status-chip" kind="primary" x-small :label="false">
								{{ t('licensing.current_plan') }}
							</VChip>
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
						<template v-if="!isLicensed">
							<VButton
								v-tooltip.bottom="isEnvManaged ? t('licensing.env_managed') : null"
								secondary
								small
								:disabled="isEnvManaged"
								@click="addLicenseDrawer = true"
							>
								{{ t('licensing.add') }}
							</VButton>
							<VButton
								small
								:href="
									getDirectusUrlWithUtm(
										DIRECTUS_PRICING_URL,
										serverStore.info.version,
										'settings_license_upgrade_plan_link',
									)
								"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ t('licensing.upgrade_plan') }}
							</VButton>
						</template>
						<template v-else>
							<VButton
								v-tooltip.bottom="isEnvManaged ? t('licensing.env_managed') : null"
								secondary
								small
								:disabled="isEnvManaged"
								@click="addLicenseDrawer = true"
							>
								{{ t('licensing.manage') }}
							</VButton>
							<VButton small :href="`${getRootPath()}license/portal`" target="_blank" rel="noopener noreferrer">
								{{ t('licensing.upgrade_plan') }}
							</VButton>
						</template>
					</div>
				</div>
				<VDivider />

				<StatusNotice class="status-notice" />

				<div class="entitlements">
					<span class="entitlements-title">{{ t('licensing.plan_usage') }}</span>
					<template v-for="item in entitlementItems" :key="item.key">
						<LicenseEntitlementItem
							v-if="item.kind === 'flag'"
							:icon="item.icon"
							:title="item.title"
							:included="item.included"
						/>
						<LicenseEntitlementItem v-else :icon="item.icon" :title="item.title" :unlimited="item.unlimited">
							<span v-if="item.formatter" class="usage-value">
								{{ item.formatter(item.limit) }}
							</span>
							<span v-else>
								<span class="usage-value">{{ item.usage ?? 0 }}</span>
								<span class="limit">/ {{ item.limit }}</span>
							</span>
						</LicenseEntitlementItem>
					</template>
				</div>

				<LicenseSection v-if="addons && addons.length > 0" icon="diamond" :title="t('licensing.addons')">
					<VList>
						<LicenseAddonItem v-for="addon in addons" :key="addon.id" :addon="addon" />
					</VList>
				</LicenseSection>

				<LicenseSection v-if="license.source !== null" icon="emergency_home" :title="t('danger_zone')" kind="danger">
					<div class="danger-zone-content">
						<VNotice v-if="isEnvManaged" type="info" class="danger-zone-notice">
							{{ t('licensing.env_managed') }}
						</VNotice>
						<VButton :disabled="isEnvManaged" :loading="deactivateLoading" danger @click="handleDeactivateClick">
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
						<a
							:href="
								getDirectusUrlWithUtm(
									DIRECTUS_OIG_URL,
									serverStore.info.version,
									'settings_license_drawer_open_innovation_grant_link',
								)
							"
							target="_blank"
							rel="noopener noreferrer"
						>
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

<style scoped lang="scss">
@use '@/styles/mixins';

.license {
	container-type: inline-size;
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	max-inline-size: 67.5rem;
}

.plan-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	flex-wrap: wrap;
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
	flex-wrap: wrap;
	gap: 0.5rem;
}

.status-chip {
	font-weight: 600;
}

.plan-actions {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
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

.status-notice {
	margin-block-start: 2.25rem;
}

.entitlements {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.5rem;
	margin-block-start: 2.25rem;

	@container (width <= 36rem) {
		grid-template-columns: 1fr;
	}
}

.entitlements-title {
	@include mixins.type-label;

	grid-column: 1 / -1;
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

	.danger-zone-notice.v-notice {
		inline-size: 100%;
	}
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
