<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import LicenseAddonsSection from './components/license-addons-section.vue';
import LicenseBanners from './components/license-banners.vue';
import LicenseDangerZone from './components/license-danger-zone.vue';
import LicenseDeactivationWorkflow from './components/license-deactivation-workflow.vue';
import LicensePlanSection from './components/license-plan-section.vue';
import LicenseUsageGrid from './components/license-usage-grid.vue';
import type { AddonRow, LicenseBannerState, LicenseUsageRow } from './components/types';
import { canManageLicense as canManageLicenseInfo, isEnvOfflineLicense } from './utils';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VDialog from '@/components/v-dialog.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useProposedLicenseChange } from '@/composables/use-proposed-license-change';
import { translateAPIError } from '@/lang';
import LicenseKeyInput from '@/modules/licensing/components/license-key-input.vue';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { LicenseDeactivationAssessment, ServerLicenseInfo } from '@/types/license';
import { notify } from '@/utils/notify';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

type CurrentSubscriptionSummary = {
	plan_id?: string;
	plan_name?: string;
	billing_interval?: string;
};

type AddonAvailability = 'available' | 'upgrade_required';

type AddonOptionsAddon = {
	id: string;
	name: string;
	description: string;
	icon: string | null;
	availability: AddonAvailability;
	billing_interval: string;
	pricing_summary: string;
	min_quantity: number;
	max_quantity: number | null;
	active_quantity: number;
	scheduled_quantity: number;
	pending_downgrade: boolean;
};

type AddonOptionsResponse = {
	current_subscription: CurrentSubscriptionSummary;
	available_addons: AddonOptionsAddon[];
};

type AddonDialogError = {
	code: string | null;
	message: string;
	setupUrl: string | null;
	setupUrlExpiresAt: string | null;
};

const { t } = useI18n();
const router = useRouter();
const serverStore = useServerStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { applyProposedKey: applyCheckedProposedKey, checkProposedKey } = useProposedLicenseChange();

const license = ref<ServerLicenseInfo | null>(null);
const addons = ref<AddonOptionsResponse | null>(null);
const editableLicenseKey = ref<string | null>(null);

const loading = ref(false);
const saving = ref(false);
const deactivating = ref(false);
const applyingProposedLicense = ref(false);
const drawerOpen = ref(false);
const licenseDrawerCanSubmit = ref(false);
const deactivationDialogOpen = ref(false);
const deactivateConfirmationOpen = ref(false);
const licenseChangeDialogOpen = ref(false);
const error = ref<unknown>(null);
const addonsError = ref<string | null>(null);
const deactivateConfirmationMode = ref<'direct' | 'anyway'>('direct');
const deactivationAssessment = ref<LicenseDeactivationAssessment | null>(null);
const proposedKey = ref<string | null>(null);
const changeAssessment = ref<LicenseDeactivationAssessment | null>(null);
const addonOpen = ref(false);
const addonItem = ref<AddonRow | null>(null);
const addonQty = ref('1');
const addonInitialQuantity = ref<number | null>(null);
const addonBusy = ref(false);
const addonErr = ref<AddonDialogError | null>(null);

const errorCode = computed(() => {
	return error.value ? translateAPIError(error.value as any) : null;
});

const errorMessage = computed(() => {
	const typedError = error.value as any;
	return typedError?.response?.data?.errors?.[0]?.message ?? typedError?.message ?? null;
});

const planName = computed(() => {
	return license.value?.plan ?? addons.value?.current_subscription.plan_name ?? t('license.no_plan');
});

const licensePortalUrl = '/server/license/portal';

const displayDateTimestamp = computed(() => {
	return license.value?.renews_at ?? license.value?.expires_at ?? null;
});

const formattedSubscriptionDate = computed(() => {
	if (!displayDateTimestamp.value) return t('license.no_expiry');
	return new Date(displayDateTimestamp.value).toLocaleDateString();
});

const expiryText = computed(() => {
	if (!displayDateTimestamp.value) return t('license.no_expiry');

	if (license.value?.renews_at) {
		return t('license.renews_on', { date: formattedSubscriptionDate.value });
	}

	return t('license.expires_on', { date: formattedSubscriptionDate.value });
});

const daysUntilExpiry = computed(() => {
	const expiry = license.value?.expires_at;
	if (!expiry) return null;

	const differenceMs = expiry - Date.now();

	if (differenceMs <= 0) return 0;

	return Math.ceil(differenceMs / (24 * 60 * 60 * 1000));
});

const daysUntilLock = computed(() => {
	const expiry = license.value?.expires_at;
	const gracePeriod = license.value?.grace_period;

	if (!expiry || typeof gracePeriod !== 'number') return null;

	const differenceMs = expiry + gracePeriod * 1000 - Date.now();

	if (differenceMs <= 0) return 0;

	return Math.ceil(differenceMs / (24 * 60 * 60 * 1000));
});

const showExpiringSoonWarning = computed(() => {
	return (
		license.value?.license_status === 'active' &&
		typeof daysUntilExpiry.value === 'number' &&
		daysUntilExpiry.value > 0 &&
		daysUntilExpiry.value <= 7
	);
});

const showExpirationGraceWarning = computed(() => {
	return license.value?.license_status === 'grace' && license.value?.license_grace_type === 'expiration';
});

const showInvalidWarning = computed(() => {
	return license.value?.license_status === 'invalid';
});

const showLockedWarning = computed(() => {
	return license.value?.license_locked === true;
});

const showEnvNotice = computed(() => {
	return license.value?.source === 'env';
});

const showEnvOffline = computed(() => {
	return isEnvOfflineLicense(license.value);
});

const hasStoredLicenseValue = computed(() => {
	return license.value?.source === 'settings';
});

const bannerState = computed<LicenseBannerState>(() => ({
	showExpiringSoonWarning: showExpiringSoonWarning.value,
	showExpirationGraceWarning: showExpirationGraceWarning.value,
	showInvalidWarning: showInvalidWarning.value,
	showLockedWarning: showLockedWarning.value,
	daysUntilExpiry: daysUntilExpiry.value,
	daysUntilLock: daysUntilLock.value,
	errorCode: drawerOpen.value ? null : errorCode.value,
	errorMessage: drawerOpen.value ? null : errorMessage.value,
}));

const managePlanLabel = computed(() => {
	return planName.value.toLowerCase().includes('starter') ? t('license.upgrade_plan') : t('license.manage_plan');
});

const showManagePlan = computed(() => {
	return !showEnvOffline.value && Boolean(license.value?.plan ?? addons.value?.current_subscription.plan_name);
});

const canManageLicense = computed(() => {
	return canManageLicenseInfo(license.value);
});

const canDeactivate = computed(() => {
	return hasStoredLicenseValue.value;
});

const canSaveLicenseKey = computed(() => {
	return licenseDrawerCanSubmit.value && !saving.value;
});

const selectedAddon = computed(() => addonItem.value);
const minQty = computed(() => selectedAddon.value?.minQuantity ?? 1);
const maxQty = computed(() => selectedAddon.value?.maxQuantity ?? null);
const canRemoveAddon = computed(() => minQty.value === 0);

const parsedQty = computed(() => {
	const quantity = Number.parseInt(addonQty.value, 10);
	return Number.isInteger(quantity) ? quantity : null;
});

const isFixedAddon = computed(() => {
	return (
		selectedAddon.value?.action === 'purchase' &&
		selectedAddon.value?.minQuantity === 1 &&
		selectedAddon.value?.maxQuantity === 1
	);
});

const showQty = computed(() => !isFixedAddon.value);
const addonErrCode = computed(() => addonErr.value?.code ?? null);
const addonErrMsg = computed(() => addonErr.value?.message ?? null);

const hasSetupUrl = computed(
	() => typeof addonErr.value?.setupUrl === 'string' && addonErr.value.setupUrl.trim() !== '',
);

const canOpenPortal = computed(
	() => addonErrCode.value === 'NO_PAYMENT_METHOD' || addonErrCode.value === 'SUBSCRIPTION_PAST_DUE',
);

const addonSaveDisabled = computed(() => {
	if (addonBusy.value || !selectedAddon.value) return true;

	const quantity = showQty.value ? parsedQty.value : 1;

	if (quantity === null) return true;

	const minQuantity = selectedAddon.value.minQuantity;
	const maxQuantity = selectedAddon.value.maxQuantity;

	if (quantity < minQuantity || (maxQuantity !== null && quantity > maxQuantity)) {
		return true;
	}

	return selectedAddon.value.action === 'manage' && quantity === addonInitialQuantity.value;
});

const confirmLabel = computed(() => {
	return selectedAddon.value?.action === 'manage' ? t('save') : t('license.addon_dialog.confirm_purchase');
});

const addonTitle = computed(() => {
	if (!selectedAddon.value) return t('license.addon_dialog.title');

	return selectedAddon.value.action === 'manage'
		? t('license.manage_addon')
		: t('license.addon_dialog.confirm_feature_purchase', { addon: selectedAddon.value.name });
});

function formatLicenseLimit(limit: number | null): string {
	return limit === null ? t('unlimited') : String(limit);
}

function formatHistoryLimit(limit: number | null): string {
	if (limit === null) return t('unlimited');
	if (limit === 0) return t('license.not_included');
	return t('license.days_count', { count: limit });
}

const usageRows = computed<LicenseUsageRow[]>(() => {
	if (!license.value) return [];

	return [
		{
			key: 'collections',
			icon: 'database',
			label: t('collections'),
			value: {
				type: 'text',
				text: `${license.value.usage.collections.current} / ${formatLicenseLimit(license.value.entitlements.collections.limit)}`,
			},
		},
		{
			key: 'policy-rules',
			icon: 'admin_panel_settings',
			label: t('license.feature.policy_rules'),
			value: {
				type: 'chip',
				text: license.value.entitlements.custom_policy_rules_enabled
					? t('license.included')
					: t('license.not_included'),
				tone: license.value.entitlements.custom_policy_rules_enabled ? 'primary' : 'neutral',
			},
		},
		{
			key: 'activity-history',
			icon: 'access_time',
			label: t('license.feature.activity_history'),
			value: {
				type: 'text',
				text: formatHistoryLimit(license.value.entitlements.activity_history_days.limit),
			},
		},
		{
			key: 'seats',
			icon: 'group',
			label: t('license.feature.seats'),
			value: {
				type: 'text',
				text: `${license.value.usage.seats.current} / ${formatLicenseLimit(license.value.entitlements.seats.limit)}`,
			},
		},
		{
			key: 'revisions-history',
			icon: 'change_history',
			label: t('license.feature.revisions_history'),
			value: {
				type: 'text',
				text: formatHistoryLimit(license.value.entitlements.revisions_history_days.limit),
			},
		},
		{
			key: 'custom-llm',
			icon: 'smart_toy',
			label: t('license.feature.custom_llm'),
			value: {
				type: 'chip',
				text: license.value.entitlements.custom_llm_enabled ? t('license.included') : t('license.not_included'),
				tone: license.value.entitlements.custom_llm_enabled ? 'primary' : 'neutral',
			},
		},
		{
			key: 'sso',
			icon: 'cloud_lock',
			label: t('license.feature.sso'),
			value: {
				type: 'chip',
				text: license.value.entitlements.sso_enabled ? t('license.included') : t('license.not_included'),
				tone: license.value.entitlements.sso_enabled ? 'primary' : 'neutral',
			},
		},
		{
			key: 'analytics',
			icon: 'analytics',
			label: t('license.feature.analytics_opt_out'),
			value: {
				type: 'chip',
				text: license.value.entitlements.analytics_opt_out_enabled ? t('license.optional') : t('license.not_included'),
				tone: license.value.entitlements.analytics_opt_out_enabled ? 'primary' : 'neutral',
			},
		},
	];
});

const addonRows = computed<AddonRow[]>(() => {
	return (addons.value?.available_addons ?? [])
		.map((addon) => {
			let action: AddonRow['action'] = 'purchase';

			if (addon.availability === 'upgrade_required') {
				action = 'upgrade';
			} else if (addon.active_quantity > 0 || addon.scheduled_quantity > 0) {
				action = 'manage';
			}

			return {
				id: addon.id,
				name: addon.name,
				description: addon.description || null,
				pricingSummary: addon.pricing_summary || null,
				icon: addon.icon || 'diamond',
				action,
				disabled:
					addon.availability === 'upgrade_required' ||
					(addon.max_quantity === 0 && addon.active_quantity === 0 && addon.scheduled_quantity === 0),
				activeQuantity: addon.active_quantity,
				scheduledQuantity: addon.scheduled_quantity,
				pendingDowngrade: addon.pending_downgrade,
				minQuantity: addon.min_quantity,
				maxQuantity: addon.max_quantity,
			};
		})
		.sort((left, right) => {
			if (left.disabled === right.disabled) return 0;
			return left.disabled ? 1 : -1;
		});
});

async function loadLicenseData() {
	loading.value = true;
	error.value = null;
	addonsError.value = null;

	const [licenseResult, addonsResult] = await Promise.allSettled([
		api.get('/server/license'),
		api.get('/server/license/addons'),
	]);

	if (licenseResult.status === 'rejected') {
		error.value = licenseResult.reason;
		loading.value = false;
		return;
	}

	license.value = licenseResult.value.data.data ?? null;

	if (addonsResult.status === 'fulfilled') {
		addons.value = addonsResult.value.data.data ?? null;
	} else {
		addons.value = null;

		addonsError.value =
			addonsResult.reason?.response?.data?.errors?.[0]?.message ??
			addonsResult.reason?.message ??
			t('unexpected_error');
	}

	loading.value = false;
}

async function refreshLicenseState() {
	await Promise.all([serverStore.hydrateInfo(), settingsStore.hydrate(), loadLicenseData()]);
}

async function handleManualDeactivationApplied(updatedAssessment: LicenseDeactivationAssessment) {
	await refreshLicenseState();
	deactivationAssessment.value = updatedAssessment;

	if (updatedAssessment?.compliant === true) {
		deactivationDialogOpen.value = false;
		openDeactivateConfirmation('direct');
		return;
	}

	deactivationDialogOpen.value = true;
}

function clearPendingLicenseChange() {
	proposedKey.value = null;
	changeAssessment.value = null;
}

function closeLicenseChangeDialog() {
	licenseChangeDialogOpen.value = false;
	clearPendingLicenseChange();
}

function handleLicenseChangeDialogUpdate(active: boolean) {
	licenseChangeDialogOpen.value = active;

	if (!active) {
		clearPendingLicenseChange();
	}
}

function openLicenseDrawer() {
	if (!canManageLicense.value) return;
	editableLicenseKey.value = null;
	licenseDrawerCanSubmit.value = false;
	error.value = null;
	drawerOpen.value = true;
}

function closeLicenseDrawer() {
	drawerOpen.value = false;
	editableLicenseKey.value = null;
	licenseDrawerCanSubmit.value = false;
	error.value = null;
}

function openAddonDialog(addon: AddonRow) {
	addonItem.value = addon;
	addonErr.value = null;
	addonOpen.value = true;

	let candidateQuantity = addon.activeQuantity;

	if (addon.action === 'purchase') {
		candidateQuantity = 1;
	} else if (addon.pendingDowngrade) {
		candidateQuantity = addon.scheduledQuantity;
	} else if (addon.scheduledQuantity > 0) {
		candidateQuantity = addon.scheduledQuantity;
	}

	const defaultQuantity = Math.max(candidateQuantity, addon.minQuantity);
	addonQty.value = String(defaultQuantity);
	addonInitialQuantity.value = defaultQuantity;
}

function closeAddonDialog() {
	addonOpen.value = false;
	addonItem.value = null;
	addonErr.value = null;
	addonQty.value = '1';
	addonInitialQuantity.value = null;
	addonBusy.value = false;
}

function onAddonDialog(active: boolean) {
	if (active) {
		addonOpen.value = true;
		return;
	}

	closeAddonDialog();
}

function setAddonErr(error: unknown) {
	const typedError = error as any;
	const details = typedError?.response?.data?.errors?.[0];
	const extensions = details?.extensions ?? {};

	const code = typeof extensions.code === 'string' ? extensions.code : null;
	const setupUrl = typeof extensions.setup_url === 'string' ? extensions.setup_url : null;

	const setupUrlExpiresAt =
		typeof extensions.setup_url_expires_at === 'string' ? extensions.setup_url_expires_at : null;

	const requiredAction = typeof extensions.required_action === 'string' ? extensions.required_action : null;

	let message = details?.message ?? typedError?.message ?? t('unexpected_error');

	if (requiredAction) {
		message = requiredAction;
	}

	if (code === 'BILLING_LINKAGE_MISSING') {
		message = t('license.addon_dialog.billing_linkage_missing');
	}

	if (code === 'SUBSCRIPTION_PAST_DUE') {
		message = t('license.addon_dialog.subscription_past_due');
	}

	if (code === 'NO_PAYMENT_METHOD' && setupUrl) {
		message = t('license.addon_dialog.payment_setup_required');
	}

	addonErr.value = {
		code,
		message,
		setupUrl,
		setupUrlExpiresAt,
	};
}

function openSetupUrl() {
	const setupUrl = addonErr.value?.setupUrl;
	if (!setupUrl) return;
	window.open(setupUrl, '_blank', 'noopener,noreferrer');
}

async function saveAddon() {
	if (!selectedAddon.value) return;

	const quantity = showQty.value ? parsedQty.value : 1;
	const minQuantity = selectedAddon.value.minQuantity;
	const maxQuantity = selectedAddon.value.maxQuantity;

	if (quantity === null) {
		addonErr.value = {
			code: 'BAD_REQUEST',
			message: t('license.addon_dialog.invalid_quantity'),
			setupUrl: null,
			setupUrlExpiresAt: null,
		};

		return;
	}

	if (quantity < minQuantity || (maxQuantity !== null && quantity > maxQuantity)) {
		addonErr.value = {
			code: 'BAD_REQUEST',
			message: t('license.addon_dialog.quantity_out_of_range', {
				min: minQuantity,
				max: maxQuantity ?? t('unlimited'),
			}),
			setupUrl: null,
			setupUrlExpiresAt: null,
		};

		return;
	}

	addonBusy.value = true;
	addonErr.value = null;

	try {
		if (quantity === 0 && selectedAddon.value.minQuantity === 0) {
			await api.delete('/server/license/addon', {
				data: {
					addon_id: selectedAddon.value.id,
				},
			});
		} else {
			await api.post('/server/license/addon', {
				addon_id: selectedAddon.value.id,
				quantity,
			});
		}

		await refreshLicenseState();
		closeAddonDialog();
		notify({ title: t('license.addon_dialog.save_success') });
	} catch (err) {
		setAddonErr(err);
	} finally {
		addonBusy.value = false;
	}
}

async function saveLicenseKey() {
	const nextLicenseKey = editableLicenseKey.value?.trim() || null;
	if (!nextLicenseKey) return;

	saving.value = true;
	error.value = null;

	try {
		const assessment = await checkProposedKey(nextLicenseKey);

		if (!assessment.compliant) {
			proposedKey.value = nextLicenseKey;
			changeAssessment.value = assessment;
			closeLicenseDrawer();
			licenseChangeDialogOpen.value = true;
			return;
		}

		await persistProposedLicenseKey(nextLicenseKey);
	} catch (err) {
		error.value = err;
		clearPendingLicenseChange();
	} finally {
		saving.value = false;
	}
}

async function persistProposedLicenseKey(licenseKey: string) {
	const result = await applyCheckedProposedKey(licenseKey);

	if (result.status === 'blocked') {
		proposedKey.value = licenseKey;
		changeAssessment.value = result.assessment;
		closeLicenseDrawer();
		licenseChangeDialogOpen.value = true;
		return;
	}

	closeLicenseDrawer();
	closeLicenseChangeDialog();
	await refreshLicenseState();
	notify({ title: t('license.save_success') });
}

async function applyProposedKey() {
	if (!proposedKey.value) return;

	applyingProposedLicense.value = true;
	error.value = null;

	try {
		await persistProposedLicenseKey(proposedKey.value);
	} catch (err) {
		error.value = err;
		closeLicenseChangeDialog();
	} finally {
		applyingProposedLicense.value = false;
	}
}

async function deactivate() {
	deactivating.value = true;
	error.value = null;

	try {
		await api.post('/server/license/deactivate');
		editableLicenseKey.value = null;
		deactivateConfirmationOpen.value = false;
		deactivationDialogOpen.value = false;
		await refreshLicenseState();

		if (serverStore.info.license_locked === true) {
			await router.push('/license-recovery');
		}

		notify({ title: t('license.deactivate_success') });
	} catch (err) {
		error.value = err;
	} finally {
		deactivating.value = false;
	}
}

async function openDeactivationDialog() {
	if (!canDeactivate.value) return;
	error.value = null;
	deactivationAssessment.value = null;

	try {
		const { data } = await api.get('/server/license/deactivation');
		const assessment = data.data as LicenseDeactivationAssessment | null;

		if (assessment?.compliant === true) {
			openDeactivateConfirmation('direct');
			return;
		}

		deactivationAssessment.value = assessment;
	} catch (err) {
		error.value = err;
		return;
	}

	deactivationDialogOpen.value = true;
}

function handleDeactivationDialogUpdate(active: boolean) {
	deactivationDialogOpen.value = active;

	if (!active) {
		deactivationAssessment.value = null;
	}
}

function openDeactivateConfirmation(mode: 'direct' | 'anyway') {
	if (!canDeactivate.value) return;
	deactivateConfirmationMode.value = mode;
	error.value = null;
	deactivateConfirmationOpen.value = true;
}

const deactivateConfirmationTitle = computed(() => {
	return deactivateConfirmationMode.value === 'anyway'
		? t('license.deactivation.deactivate_anyway_title')
		: t('license.deactivation.confirm_title');
});

const deactivateConfirmationCopy = computed(() => {
	return deactivateConfirmationMode.value === 'anyway'
		? t('license.deactivation.deactivate_anyway_copy')
		: t('license.deactivation.confirm_copy');
});

onMounted(() => {
	void loadLicenseData();
});
</script>

<template>
	<PrivateView :title="$t('settings_license')" icon="diamond">
		<template #headline><VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="settings">
			<div v-if="loading" class="loading-state">
				<VProgressCircular indeterminate />
			</div>

			<VNotice v-else-if="!license && errorMessage" type="danger">
				<p v-if="errorCode" class="error-code">{{ errorCode }}</p>
				<p>{{ errorMessage }}</p>
			</VNotice>

			<template v-else-if="license">
				<LicensePlanSection
					:plan-name="planName"
					:status="license.status"
					:expiry-text="expiryText"
					:can-manage-license="canManageLicense"
					:show-manage-plan="showManagePlan"
					:manage-plan-label="managePlanLabel"
					:manage-plan-href="licensePortalUrl"
					@manage-license="openLicenseDrawer"
				/>

				<div class="content-stack">
					<LicenseBanners :state="bannerState" />

					<LicenseUsageGrid :title="$t('license.plan_usage')" :rows="usageRows" />

					<LicenseAddonsSection
						v-if="showManagePlan"
						:title="$t('license.addon_packages')"
						:error="addonsError"
						:rows="addonRows"
						:license-portal-href="licensePortalUrl"
						@manage-addon="openAddonDialog"
					/>

					<LicenseDangerZone
						:title="$t('license.danger_zone')"
						:can-deactivate="canDeactivate"
						:deactivating="deactivating"
						:env-notice="showEnvNotice ? t('license.env_notice') : null"
						@deactivate="openDeactivationDialog"
					/>
				</div>
			</template>
		</div>

		<VDrawer
			v-model="drawerOpen"
			:title="$t('license.manage_license_title')"
			icon="vpn_key"
			@cancel="closeLicenseDrawer"
			@apply="saveLicenseKey"
		>
			<template #actions>
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('save')"
					:disabled="!canSaveLicenseKey"
					:loading="saving"
					icon="check"
					@click="saveLicenseKey"
				/>
			</template>

			<div class="drawer-content">
				<VNotice v-if="error && drawerOpen" type="danger">
					<p v-if="errorCode" class="error-code">{{ errorCode }}</p>
					<p>{{ errorMessage }}</p>
				</VNotice>

				<LicenseKeyInput
					v-if="drawerOpen"
					v-model="editableLicenseKey"
					variant="drawer"
					:has-stored-value="hasStoredLicenseValue && editableLicenseKey === null"
					:utm-term="serverStore.info.version"
					utm-content="settings_drawer"
					@can-submit-change="licenseDrawerCanSubmit = $event"
				/>
			</div>
		</VDrawer>

		<VDialog
			v-model="deactivationDialogOpen"
			keep-behind
			@update:model-value="handleDeactivationDialogUpdate"
			@esc="handleDeactivationDialogUpdate(false)"
		>
			<div class="recovery-dialog">
				<LicenseDeactivationWorkflow
					mode="manual_deactivation"
					:title="$t('license.deactivation.title')"
					:license="license"
					:initial-assessment="deactivationAssessment"
					:current-user-email="
						userStore.currentUser && !('share' in userStore.currentUser) ? userStore.currentUser.email : null
					"
					:can-manage-license="false"
					:can-deactivate-license="canDeactivate"
					:deactivating-license="deactivating"
					@deactivate-license="openDeactivateConfirmation('direct')"
					@deactivate-anyway="openDeactivateConfirmation('anyway')"
					@remediation-applied="handleManualDeactivationApplied"
				/>
			</div>
		</VDialog>

		<VDialog :model-value="addonOpen" @update:model-value="onAddonDialog" @esc="closeAddonDialog">
			<div class="addon-dialog">
				<h2 class="addon-dialog-title">{{ addonTitle }}</h2>

				<div v-if="showQty" class="addon-dialog-field">
					<div class="addon-quantity-input">
						<VIcon class="addon-quantity-icon" :name="selectedAddon?.icon ?? 'diamond'" />
						<VInput id="addon-quantity" v-model="addonQty" type="number" :min="minQty" :max="maxQty ?? undefined" />
					</div>
					<p v-if="selectedAddon?.pricingSummary" class="addon-dialog-pricing">{{ selectedAddon.pricingSummary }}</p>
				</div>

				<VNotice v-if="addonErrMsg" type="danger">
					<p v-if="addonErrCode" class="error-code">{{ addonErrCode }}</p>
					<p>{{ addonErrMsg }}</p>
					<p v-if="addonErr?.setupUrlExpiresAt" class="addon-dialog-help">
						{{
							$t('license.addon_dialog.setup_url_expires_at', {
								date: new Date(addonErr.setupUrlExpiresAt).toLocaleString(),
							})
						}}
					</p>
				</VNotice>

				<div class="addon-dialog-actions">
					<VButton secondary @click="closeAddonDialog">
						{{ $t('cancel') }}
					</VButton>
					<VButton v-if="hasSetupUrl" secondary class="addon-setup-payment" @click="openSetupUrl">
						{{ $t('license.addon_dialog.setup_payment') }}
					</VButton>
					<VButton v-if="canOpenPortal" secondary class="addon-open-portal" :href="licensePortalUrl" target="_blank">
						{{ $t('license.addon_dialog.open_portal') }}
					</VButton>
					<VButton
						v-if="canRemoveAddon && parsedQty === 0"
						kind="danger"
						:disabled="addonSaveDisabled"
						class="addon-save"
						@click="saveAddon"
					>
						{{ $t('license.addon_dialog.remove') }}
					</VButton>
					<VButton v-else :disabled="addonSaveDisabled" class="addon-save" @click="saveAddon">
						{{ confirmLabel }}
					</VButton>
				</div>
			</div>
		</VDialog>

		<VDialog
			:model-value="licenseChangeDialogOpen"
			keep-behind
			@update:model-value="handleLicenseChangeDialogUpdate"
			@esc="closeLicenseChangeDialog"
		>
			<div class="recovery-dialog">
				<LicenseDeactivationWorkflow
					mode="license_change"
					:title="$t('license.change_license_title')"
					:license="license"
					:initial-assessment="changeAssessment"
					:license-key="proposedKey"
					:current-user-email="
						userStore.currentUser && !('share' in userStore.currentUser) ? userStore.currentUser.email : null
					"
					:deactivating-license="applyingProposedLicense"
					@apply-license-change="applyProposedKey"
					@remediation-applied="refreshLicenseState"
				/>
			</div>
		</VDialog>

		<VDialog v-model="deactivateConfirmationOpen" @esc="deactivateConfirmationOpen = false">
			<div class="confirm-dialog">
				<h2>{{ deactivateConfirmationTitle }}</h2>
				<p>{{ deactivateConfirmationCopy }}</p>

				<VNotice v-if="error && deactivateConfirmationOpen" type="danger">
					<p v-if="errorCode" class="error-code">{{ errorCode }}</p>
					<p>{{ errorMessage }}</p>
				</VNotice>

				<div class="confirm-actions">
					<VButton secondary class="confirm-cancel" @click="deactivateConfirmationOpen = false">
						{{ $t('cancel') }}
					</VButton>
					<VButton class="confirm-deactivate" kind="danger" :disabled="deactivating" @click="deactivate">
						{{ $t('license.deactivate') }}
					</VButton>
				</div>
			</div>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.settings {
	display: grid;
	gap: 1.5rem;
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	max-inline-size: 67.5rem;
	inline-size: 100%;
}

.loading-state {
	display: grid;
	place-items: center;
	min-block-size: 18rem;
}

.content-stack {
	display: grid;
	gap: 1.5rem;
	max-inline-size: 58rem;
}

.drawer-content {
	display: grid;
	gap: 1rem;
	padding: var(--content-padding);
}

.error-code {
	margin: 0 0 0.25rem;
	font-weight: 600;
}

.recovery-dialog {
	inline-size: min(72rem, calc(100vw - 2rem));
	max-block-size: calc(100vh - 2rem);
	padding: 1.5rem;
	overflow: auto;
	background: var(--theme--background);
	border-radius: var(--theme--border-radius);
}

.confirm-dialog {
	display: grid;
	gap: 1rem;
	inline-size: min(32rem, calc(100vw - 2rem));
	padding: 1.5rem;
	background: var(--theme--background);
	border-radius: var(--theme--border-radius);
}

.confirm-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
}

.confirm-deactivate:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.addon-dialog {
	inline-size: min(31.5rem, calc(100vw - 2rem));
	padding: 1.5rem;
	background: var(--theme--background);
	border-radius: var(--theme--border-radius);
	display: grid;
	gap: 1rem;
}

.addon-dialog-title {
	margin: 0;
	font-size: 1rem;
	font-weight: 700;
	color: var(--theme--foreground);
}

.addon-dialog-pricing {
	margin: 0;
	font-size: 0.75rem;
	color: var(--theme--foreground-accent);
}

.addon-dialog-field {
	display: grid;
	gap: 0.375rem;
}

.addon-quantity-input {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	padding-inline-start: 0.75rem;
}

.addon-quantity-icon {
	--v-icon-color: var(--theme--foreground-subdued);
}

.addon-quantity-input :deep(.v-input) {
	flex: 1;
}

.addon-quantity-input :deep(.v-input .input) {
	border: 0;
}

.addon-dialog-help {
	margin: 0;
	font-size: 0.8125rem;
	color: var(--theme--foreground-subdued);
}

.addon-dialog-actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.5rem;
	margin-block-start: 0.25rem;
}
</style>
