<script setup lang="ts">
import {
	type InvalidLicenseStatus,
	type LicensePendingResolution,
	type LicensePendingResolutionFeatureGateCustomLLMs,
	type LicensePendingResolutionFeatureGateCustomPermissionRules,
	type LicensePendingResolutionFeatureGateSSO,
	type LicensePendingResolutionLimitCollections,
	type LicensePendingResolutionLimitFlows,
	type LicensePendingResolutionLimitSeats,
} from '@directus/license';
import { useCookies } from '@vueuse/integrations/useCookies';
import { storeToRefs } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ResolutionLimitSection from './resolution-limit-section.vue';
import ResolutionSsoAdminDialog from './resolution-sso-admin-dialog.vue';
import ResolutionSsoSection from './resolution-sso-section.vue';
import VAvatar from '@/components/v-avatar.vue';
import VButton from '@/components/v-button.vue';
import VCardText from '@/components/v-card-text.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import DrawerItem from '@/views/private/components/drawer-item.vue';

defineProps<{
	/** Whether the dialog is open (v-model) */
	modelValue: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	confirm: [];
}>();

const { t } = useI18n();
const router = useRouter();

const licenseStore = useLicenseStore();
const { info, pendingResolution } = storeToRefs(licenseStore);

const userStore = useUserStore();

type ResolveScope = 'manual' | 'locked' | 'env_removed' | 'grace' | 'no_resolution';

const scope = computed<ResolveScope>(() => {
	if (info.value === null) return 'env_removed';

	if (info.value.status === 'grace') return 'grace';
	if (info.value.status === 'locked') return 'locked';

	// Downgraded to core (within limits): informational acknowledgement.
	if (info.value.downgrade_reason != null) return 'no_resolution';

	return 'manual';
});

const graceCountdown = computed<{ days: number; date: string } | null>(() => {
	if (scope.value !== 'grace' || !info.value?.expires_at) return null;
	const deadlineSeconds = info.value.expires_at + (info.value.grace_period ?? 0);
	const deadlineMs = deadlineSeconds * 1000;
	const days = Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)));
	const date = new Date(deadlineMs).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	return { days, date };
});

type TitleKey = ResolveScope | InvalidLicenseStatus;

const title = computed<string>(() => {
	const reason = info.value?.downgrade_reason;
	const key: TitleKey = reason && (scope.value === 'locked' || scope.value === 'no_resolution') ? reason : scope.value;
	return t(`licensing.resolve_title_${key}`);
});

const noticeMessage = computed(() => t(`licensing.resolve_notice_${scope.value}`));

const severity = computed<'warning' | 'danger'>(() => {
	return scope.value === 'grace' || scope.value === 'no_resolution' ? 'warning' : 'danger';
});

type SeatCandidate = LicensePendingResolutionLimitSeats['candidates'][number] & {
	email?: string | null;
	disabled?: boolean;
};
type FlowCandidate = LicensePendingResolutionLimitFlows['candidates'][number];

const collections = computed<LicensePendingResolutionLimitCollections | undefined>(
	() => find('limit', 'collections') as LicensePendingResolutionLimitCollections | undefined,
);

const collectionGroups = computed(() => {
	if (!collections.value || collections.value.candidates.length === 0) return [];
	return [{ caption: t('licensing.resolve_section_collections_caption'), candidates: collections.value.candidates }];
});

const seats = computed<LicensePendingResolutionLimitSeats | undefined>(
	() => find('limit', 'seats') as LicensePendingResolutionLimitSeats | undefined,
);

const currentAdminCandidate = computed<SeatCandidate | null>(() => {
	const user = userStore.currentUser;
	if (!user || 'share' in user) return null;

	return {
		id: user.id,
		first_name: user.first_name ?? null,
		last_name: user.last_name ?? null,
		avatar: typeof user.avatar === 'string' ? user.avatar : (user.avatar?.id ?? null),
		admin: true,
		disabled: true,
	};
});

const seatGroups = computed(() => {
	if (!seats.value) return [];
	const users: SeatCandidate[] = [];
	const admins: SeatCandidate[] = [];

	for (const candidate of seats.value.candidates) {
		if (candidate.admin) admins.push(candidate);
		else users.push(candidate);
	}

	if (currentAdminCandidate.value) admins.push(currentAdminCandidate.value);

	const groups: Array<{ caption: string; candidates: SeatCandidate[] }> = [];
	if (users.length > 0) groups.push({ caption: t('licensing.resolve_section_seats_users_caption'), candidates: users });

	if (admins.length > 0) {
		groups.push({ caption: t('licensing.resolve_section_seats_admins_caption'), candidates: admins });
	}

	return groups;
});

const flows = computed<LicensePendingResolutionLimitFlows | undefined>(
	() => find('limit', 'flows') as LicensePendingResolutionLimitFlows | undefined,
);

const flowGroups = computed(() => {
	if (!flows.value || flows.value.candidates.length === 0) return [];
	return [{ caption: t('licensing.resolve_section_flows_caption'), candidates: flows.value.candidates }];
});

const sso = computed<LicensePendingResolutionFeatureGateSSO | undefined>(
	() => find('feature_gate', 'sso_enabled') as LicensePendingResolutionFeatureGateSSO | undefined,
);

const customLLMs = computed<LicensePendingResolutionFeatureGateCustomLLMs | undefined>(
	() => find('feature_gate', 'custom_llms_enabled') as LicensePendingResolutionFeatureGateCustomLLMs | undefined,
);

const customPermissionRules = computed<LicensePendingResolutionFeatureGateCustomPermissionRules | undefined>(
	() =>
		find('feature_gate', 'custom_permission_rules_enabled') as
			| LicensePendingResolutionFeatureGateCustomPermissionRules
			| undefined,
);

const aiTranslations = computed(
	() => (scope.value === 'manual' || scope.value === 'no_resolution') && licenseStore.aiTranslationsEnabled,
);

function find(kind: LicensePendingResolution['kind'], key: string): LicensePendingResolution | undefined {
	return pendingResolution.value?.find((entry: LicensePendingResolution) => entry.kind === kind && entry.key === key);
}

function toUser(candidate: SeatCandidate) {
	return {
		first_name: candidate.first_name ?? undefined,
		last_name: candidate.last_name ?? undefined,
		email: candidate.email ?? undefined,
	};
}

const selected = reactive({
	collections: new Set<string>(),
	seats: new Set<string>(),
	flows: new Set<string>(),
	sso: false,
	customLLMs: false,
	customPermissionRules: false,
	aiTranslations: false,
});

const adminCreds = ref<{ email?: string; password?: string }>({});
const ssoAdminDialogOpen = ref(false);

function onSsoConfirm(creds: { email: string; password?: string }) {
	adminCreds.value = creds;
	selected.sso = true;
}

const editingUserId = ref<string | null>(null);

const userDrawerActive = computed({
	get: () => editingUserId.value !== null,
	set: (value: boolean) => {
		if (!value) editingUserId.value = null;
	},
});

function openUserDrawer(candidate: SeatCandidate) {
	editingUserId.value = candidate.id;
}

const isValid = computed(() => {
	if (collections.value && selected.collections.size < collections.value.usage - collections.value.limit) return false;
	if (seats.value && selected.seats.size < seats.value.usage - seats.value.limit) return false;
	if (flows.value && selected.flows.size < flows.value.usage - flows.value.limit) return false;
	if (sso.value && !selected.sso) return false;
	if (customLLMs.value && !selected.customLLMs) return false;
	if (customPermissionRules.value && !selected.customPermissionRules) return false;
	if (aiTranslations.value && !selected.aiTranslations) return false;
	return true;
});

const submitting = ref(false);

async function submit() {
	if (!isValid.value || submitting.value) return;

	submitting.value = true;

	try {
		// Feature gates custom_llms_enabled and custom_permission_rules_enabled are
		// locked server-side without user action and are intentionally not submitted.
		await licenseStore.resolve({
			...(collections.value ? { collections: [...selected.collections] } : {}),
			...(seats.value ? { seats: [...selected.seats] } : {}),
			...(flows.value ? { flows: [...selected.flows] } : {}),
			...(sso.value ? { sso_enabled: { admin: { ...adminCreds.value } } } : {}),
		});

		if (scope.value === 'manual') {
			emit('confirm');
		} else {
			emit('update:modelValue', false);
		}
	} catch (err) {
		unexpectedError(err);
	} finally {
		submitting.value = false;

		if (router.currentRoute.value.name === 'license-recovery') {
			router.push({ name: 'settings-license' });
		}
	}
}

function manageLicense() {
	// For locked scopes the router guard redirects back to /license-recovery, so closing
	// the modal would leave a blank page behind. Only close in the (dismissible) manual/no_resolution flows.
	if (scope.value === 'manual' || scope.value === 'no_resolution') {
		emit('update:modelValue', false);
	}

	router.push({ name: 'settings-license' });
}

const cookies = useCookies(['license-resolution-acknowledged']);

// Scope the acknowledgement to the current license so applying a new key resets the dismiss.
const acknowledgeKey = computed(() => {
	const name = info.value?.name ?? '';
	const boundary = info.value?.expires_at ?? info.value?.renews_at ?? '';
	return `${name}:${boundary}`;
});

function acknowledge() {
	// Dismiss for this session. The cookie is cleared on logout so the modal reappears next login.
	cookies.set('license-resolution-acknowledged', acknowledgeKey.value, { path: '/' });
	emit('update:modelValue', false);
}

function close() {
	emit('update:modelValue', false);
}

function onEsc() {
	if (scope.value === 'manual') close();
	else if (scope.value === 'grace') acknowledge();
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		:persistent="scope !== 'manual'"
		:keep-behind="userDrawerActive"
		@update:model-value="emit('update:modelValue', $event)"
		@esc="onEsc"
	>
		<VCard class="resolution-card">
			<header class="title-row">
				<div class="title-stack">
					<span class="title-text" :class="severity">{{ title }}</span>
					<span class="subtitle">{{ t('licensing.resolve_subtitle') }}</span>
				</div>
				<VButton secondary small @click="manageLicense">
					{{ t('licensing.manage') }}
				</VButton>
			</header>

			<VCardText>
				<VNotice :type="severity" :icon="severity === 'warning' ? 'warning' : 'cancel'" class="notice">
					{{ noticeMessage }}
				</VNotice>

				<p v-if="scope === 'grace' && graceCountdown" class="countdown">
					{{ t('licensing.resolve_countdown', graceCountdown, graceCountdown.days) }}
				</p>

				<div v-if="sso || customLLMs || customPermissionRules || aiTranslations" class="feature-gate-grid">
					<ResolutionSsoSection v-if="sso" v-model="selected.sso" @open-admin-dialog="ssoAdminDialogOpen = true" />

					<section v-if="customLLMs" class="resolution-feature-section">
						<header class="section-header">
							<span class="section-title">{{ t('licensing.resolve_section_custom_llms') }}</span>
						</header>
						<button
							type="button"
							class="confirm"
							:class="{ selected: selected.customLLMs }"
							@click="selected.customLLMs = !selected.customLLMs"
						>
							<VCheckbox :checked="selected.customLLMs" style="pointer-events: none" />
							<span>{{ t('licensing.resolve_custom_llms_confirm') }}</span>
						</button>
						<p class="feature-caption">{{ t('licensing.resolve_custom_llms_caption') }}</p>
					</section>

					<section v-if="customPermissionRules" class="resolution-feature-section">
						<header class="section-header">
							<span class="section-title">{{ t('licensing.resolve_section_custom_permissions') }}</span>
						</header>
						<button
							type="button"
							class="confirm"
							:class="{ selected: selected.customPermissionRules }"
							@click="selected.customPermissionRules = !selected.customPermissionRules"
						>
							<VCheckbox :checked="selected.customPermissionRules" style="pointer-events: none" />
							<span>{{ t('licensing.resolve_custom_permissions_confirm') }}</span>
						</button>
						<p class="feature-caption">{{ t('licensing.resolve_custom_permissions_caption') }}</p>
					</section>

					<section v-if="aiTranslations" class="resolution-feature-section">
						<header class="section-header">
							<span class="section-title">{{ t('licensing.resolve_section_ai_translations') }}</span>
						</header>
						<button
							type="button"
							class="confirm"
							:class="{ selected: selected.aiTranslations }"
							@click="selected.aiTranslations = !selected.aiTranslations"
						>
							<VCheckbox :checked="selected.aiTranslations" style="pointer-events: none" />
							<span>{{ t('licensing.resolve_ai_translations_confirm') }}</span>
						</button>
						<p class="feature-caption">{{ t('licensing.resolve_ai_translations_caption') }}</p>
					</section>
				</div>

				<ResolutionLimitSection
					v-if="collections && collectionGroups.length > 0"
					v-model="selected.collections"
					icon="database"
					:title="t('licensing.resolve_section_collections')"
					:usage="collections.usage"
					:limit="collections.limit"
					:groups="collectionGroups"
					:id-for="(name: string) => name"
				/>

				<ResolutionLimitSection
					v-if="seatGroups.length > 0 && seats"
					v-model="selected.seats"
					icon="group"
					:title="t('licensing.resolve_section_seats')"
					:usage="seats.usage"
					:limit="seats.limit"
					:groups="seatGroups"
					:id-for="(user: SeatCandidate) => user.id"
					:disabled-for="(user: SeatCandidate) => user.disabled === true"
					linkable
					@open-item="openUserDrawer"
				>
					<template #item="{ candidate }">
						<VAvatar x-small round>
							<img v-if="candidate.avatar" :src="`/assets/${candidate.avatar}`" :alt="userName(toUser(candidate))" />
							<VIcon v-else name="person" small />
						</VAvatar>
						<span class="item-label">{{ userName(toUser(candidate)) }}</span>
					</template>
				</ResolutionLimitSection>

				<ResolutionLimitSection
					v-if="flows && flowGroups.length > 0"
					v-model="selected.flows"
					icon="bolt"
					:title="t('licensing.resolve_section_flows')"
					:usage="flows.usage"
					:limit="flows.limit"
					:groups="flowGroups"
					:id-for="(flow: FlowCandidate) => flow.id"
				>
					<template #item="{ candidate }">
						<span class="item-label">{{ candidate.name }}</span>
					</template>
				</ResolutionLimitSection>
			</VCardText>

			<footer class="action-row">
				<VButton v-if="scope === 'manual'" secondary @click="close">{{ t('cancel') }}</VButton>
				<VButton v-else-if="scope === 'grace'" secondary @click="acknowledge">
					{{ t('licensing.resolve_acknowledge') }}
				</VButton>
				<VButton v-else-if="scope === 'no_resolution'" :loading="submitting" @click="submit">
					{{ t('continue_label') }}
				</VButton>
				<VButton
					v-if="!['grace', 'no_resolution'].includes(scope)"
					kind="danger"
					:disabled="!isValid"
					:loading="submitting"
					@click="submit"
				>
					{{ t('licensing.resolve_submit') }}
				</VButton>
			</footer>

			<ResolutionSsoAdminDialog
				v-if="sso"
				v-model="ssoAdminDialogOpen"
				:blockers="sso.blockers"
				@confirm="onSsoConfirm"
			/>

			<DrawerItem
				v-model:active="userDrawerActive"
				collection="directus_users"
				:primary-key="editingUserId || '+'"
				:selected-fields="[
					'first_name',
					'last_name',
					'email',
					'avatar',
					'title',
					'status',
					'role',
					'provider',
					'external_identifier',
					'policies',
				]"
				non-editable
			/>
		</VCard>
	</VDialog>
</template>

<style scoped>
.resolution-card {
	--v-card-min-width: auto;
	inline-size: min(60rem, calc(100vw - 7rem));
	max-inline-size: none;
	block-size: auto;
	max-block-size: calc(100vh - 7rem);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.resolution-card :deep(.v-card-text) {
	flex: 1;
	overflow-y: auto;
	padding-block-start: 1rem;
}

.action-row {
	display: flex;
	justify-content: flex-end;
	gap: 0.6875rem;
	padding: 1rem 1.75rem;
	border-block-start: 1px solid var(--theme--border-color-subdued);
}

.title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1rem 1.75rem;
	border-block-end: 1px solid var(--theme--border-color-subdued);
}

.title-stack {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	min-inline-size: 0;
}

.title-text {
	font-size: 1rem;
	font-weight: 600;
}

.title-text.danger {
	color: var(--theme--danger);
}

.title-text.warning {
	color: var(--theme--warning);
}

.subtitle {
	color: var(--theme--foreground-normal);
	font-weight: 500;
}

.notice {
	margin-block-end: 1rem;
}

.countdown {
	margin-block-end: 1rem;
	color: var(--theme--warning);
	font-weight: 600;
}

.item-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.feature-gate-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1.5rem;
	margin-block-start: 2rem;
}

@media (max-width: 37.5rem) {
	.feature-gate-grid {
		grid-template-columns: 1fr;
	}
}

.section-header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-block-end: 0.75rem;
}

.section-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}

.confirm {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	inline-size: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background: var(--theme--form--field--input--background);
	color: var(--theme--foreground);
	font: inherit;
	text-align: start;
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
}

.confirm:hover {
	border-color: var(--theme--form--field--input--border-color-hover);
}

.confirm.selected {
	border-color: var(--theme--primary);
}

.feature-caption {
	color: var(--theme--foreground-subdued);
	margin-block-start: 0.5rem;
	font-size: 0.8125rem;
	line-height: 1.4;
}
</style>
