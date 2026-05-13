<script setup lang="ts">
import {
	type LicensePendingResolution,
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
import ResolutionSsoSection from './resolution-sso-section.vue';
import VAvatar from '@/components/v-avatar.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';

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

type ResolveScope = 'manual' | 'expired' | 'suspended' | 'env_removed' | 'grace';

const scope = computed<ResolveScope>(() => {
	if (info.value === null) return 'env_removed';
	const status = info.value.status;
	if (status === 'grace') return 'grace';
	if (status === 'expired' || status === 'locked') return 'expired';
	if (status === 'suspended' || status === 'canceled') return 'suspended';
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

const title = computed(() => t(`licensing.resolve_title_${scope.value}`));

const noticeMessage = computed(() => t(`licensing.resolve_notice_${scope.value}`));

type SeatCandidate = LicensePendingResolutionLimitSeats['candidates'][number];

const collections = computed<LicensePendingResolutionLimitCollections | undefined>(
	() => find('limit', 'collections') as LicensePendingResolutionLimitCollections | undefined,
);

const seats = computed<LicensePendingResolutionLimitSeats | undefined>(
	() => find('limit', 'seats') as LicensePendingResolutionLimitSeats | undefined,
);

const flows = computed<LicensePendingResolutionLimitFlows | undefined>(
	() => find('limit', 'flows') as LicensePendingResolutionLimitFlows | undefined,
);

const sso = computed<LicensePendingResolutionFeatureGateSSO | undefined>(
	() => find('feature_gate', 'sso_enabled') as LicensePendingResolutionFeatureGateSSO | undefined,
);

function find(kind: LicensePendingResolution['kind'], key: string): LicensePendingResolution | undefined {
	return pendingResolution.value?.find((entry: LicensePendingResolution) => entry.kind === kind && entry.key === key);
}

function toUser(candidate: SeatCandidate) {
	return {
		first_name: candidate.first_name ?? undefined,
		last_name: candidate.last_name ?? undefined,
	};
}

const selected = reactive({
	collections: new Set<string>(),
	seats: new Set<string>(),
	flows: new Set<string>(),
	sso: false,
});

const adminCreds = ref<{ email?: string; password?: string }>({});
const ssoSectionRef = ref<InstanceType<typeof ResolutionSsoSection> | null>(null);

const isValid = computed(() => {
	if (collections.value && selected.collections.size < collections.value.usage - collections.value.limit) return false;
	if (seats.value && selected.seats.size < seats.value.usage - seats.value.limit) return false;
	if (flows.value && selected.flows.size < flows.value.usage - flows.value.limit) return false;
	if (sso.value && !ssoSectionRef.value?.isValid) return false;
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
			...(sso.value
				? {
						sso_enabled: sso.value.blockers?.length ? { admin: { ...adminCreds.value } } : true,
					}
				: {}),
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
	}
}

function manageLicense() {
	// For locked scopes the router guard redirects back to /license-recovery, so closing
	// the modal would leave a blank page behind. Only close in the (dismissible) manual flow.
	if (scope.value === 'manual') {
		emit('update:modelValue', false);
	}

	router.push('/settings/license');
}

const cookies = useCookies(['license-resolution-acknowledged']);

function acknowledge() {
	// Dismiss for this session. The cookie is cleared on logout so the modal reappears next login.
	cookies.set('license-resolution-acknowledged', 'true', { path: '/' });
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
		@update:model-value="emit('update:modelValue', $event)"
		@esc="onEsc"
	>
		<VCard class="resolution-card">
			<VCardTitle class="title-row">
				<span class="title-text">{{ title }}</span>
				<VButton secondary small @click="manageLicense">
					{{ t('licensing.manage') }}
				</VButton>
			</VCardTitle>

			<VCardText>
				<p class="subtitle">{{ t('licensing.resolve_subtitle') }}</p>

				<VNotice
					:type="scope === 'grace' ? 'warning' : 'danger'"
					:icon="scope === 'grace' ? 'warning' : 'cancel'"
					class="notice"
				>
					{{ noticeMessage }}
				</VNotice>

				<p v-if="scope === 'grace' && graceCountdown" class="countdown">
					{{ t('licensing.resolve_countdown', graceCountdown, graceCountdown.days) }}
				</p>

				<ResolutionSsoSection
					v-if="sso"
					ref="ssoSectionRef"
					v-model="selected.sso"
					:blockers="sso.blockers"
					@update:admin="adminCreds = $event"
				/>

				<ResolutionLimitSection
					v-if="collections && collections.candidates.length > 0"
					v-model="selected.collections"
					icon="database"
					:title="t('licensing.resolve_section_collections')"
					:description="t('licensing.resolve_section_collections_caption')"
					:usage="collections.usage"
					:limit="collections.limit"
					:candidates="collections.candidates"
					:id-for="(name: string) => name"
				/>

				<ResolutionLimitSection
					v-if="seats && seats.candidates.length > 0"
					v-model="selected.seats"
					icon="group"
					:title="t('licensing.resolve_section_seats')"
					:description="t('licensing.resolve_section_seats_caption')"
					:usage="seats.usage"
					:limit="seats.limit"
					:candidates="seats.candidates"
					:id-for="(user: SeatCandidate) => user.id"
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
					v-if="flows && flows.candidates.length > 0"
					v-model="selected.flows"
					icon="bolt"
					:title="t('licensing.resolve_section_flows')"
					:description="t('licensing.resolve_section_flows_caption')"
					:usage="flows.usage"
					:limit="flows.limit"
					:candidates="flows.candidates"
					:id-for="(name: string) => name"
				/>
			</VCardText>

			<VCardActions>
				<VButton v-if="scope === 'manual'" secondary @click="close">{{ t('cancel') }}</VButton>
				<VButton v-else-if="scope === 'grace'" secondary @click="acknowledge">
					{{ t('licensing.resolve_acknowledge') }}
				</VButton>
				<VButton :disabled="!isValid" :loading="submitting" @click="submit">
					{{ t('licensing.resolve_submit') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style scoped>
.resolution-card {
	max-inline-size: 60rem;
	inline-size: 100%;
}

.title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.title-text {
	color: var(--theme--danger);
}

.subtitle {
	color: var(--theme--foreground-subdued);
	margin-block-end: 1rem;
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
</style>
