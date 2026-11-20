<script setup lang="ts">
import type { LicenseResolvedUser } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { canSubmitRestore, countNotRestored } from '../utils/restore-capacity';
import ResolutionLimitSection from './resolution-limit-section.vue';
import ResolutionUserItem from './resolution-user-item.vue';
import VButton from '@/components/v-button.vue';
import VCardText from '@/components/v-card-text.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';
import { useLicenseStore } from '@/stores/license';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerItem from '@/views/private/components/drawer-item.vue';

const props = defineProps<{
	modelValue: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();

const licenseStore = useLicenseStore();
const { resolvedItems } = storeToRefs(licenseStore);

type FlowCandidate = { id: string; name: string };

const selected = reactive({
	collections: new Set<string>(),
	seats: new Set<string>(),
	flows: new Set<string>(),
	sso_users: new Set<string>(),
});

watch(
	() => props.modelValue,
	(open) => {
		if (!open) return;

		for (const set of Object.values(selected)) set.clear();
	},
);

const collections = computed(() => resolvedItems.value?.collections);
const seats = computed(() => resolvedItems.value?.seats);
const flows = computed(() => resolvedItems.value?.flows);
const ssoUsers = computed(() => resolvedItems.value?.sso_users);

const collectionGroups = computed(() => [
	{ caption: t('licensing.restore_section_collections_caption'), candidates: collections.value?.candidates ?? [] },
]);

const seatGroups = computed(() => [
	{ caption: t('licensing.restore_section_seats_caption'), candidates: seats.value?.candidates ?? [] },
]);

const flowGroups = computed(() => [
	{ caption: t('licensing.restore_section_flows_caption'), candidates: flows.value?.candidates ?? [] },
]);

const ssoGroups = computed(() => [
	{ caption: t('licensing.restore_section_sso_caption'), candidates: ssoUsers.value?.candidates ?? [] },
]);

// Seats and SSO users share the seat entitlement
const seatUsage = computed(() => seats.value?.usage ?? ssoUsers.value?.usage ?? 0);

const isValid = computed(() => {
	if (!resolvedItems.value) return false;

	return canSubmitRestore(resolvedItems.value, {
		collections: selected.collections.size,
		flows: selected.flows.size,
		seats: selected.seats.size,
		sso_users: selected.sso_users.size,
	});
});

const submitting = ref(false);

async function submit() {
	if (!isValid.value || submitting.value) return;

	submitting.value = true;

	try {
		const payload = {
			...(selected.collections.size > 0 ? { collections: [...selected.collections] } : {}),
			...(selected.seats.size > 0 ? { seats: [...selected.seats] } : {}),
			...(selected.flows.size > 0 ? { flows: [...selected.flows] } : {}),
			...(selected.sso_users.size > 0 ? { sso_users: [...selected.sso_users] } : {}),
		};

		const restored = await licenseStore.restore(payload);
		const notRestored = countNotRestored(payload, restored);

		if (notRestored > 0) {
			notify({ title: t('licensing.restore_partial', { count: notRestored }, notRestored), type: 'warning' });
		}

		emit('update:modelValue', false);
	} catch (err) {
		unexpectedError(err);
	} finally {
		submitting.value = false;
	}
}

function close() {
	emit('update:modelValue', false);
}

const editingUserId = ref<string | null>(null);

const userDrawerActive = computed({
	get: () => editingUserId.value !== null,
	set: (value: boolean) => {
		if (!value) editingUserId.value = null;
	},
});

function openUserDrawer(candidate: LicenseResolvedUser) {
	editingUserId.value = candidate.id;
}
</script>

<template>
	<VDialog
		:model-value="modelValue"
		:keep-behind="userDrawerActive"
		@update:model-value="emit('update:modelValue', $event)"
		@esc="close"
	>
		<VCard class="restore-card">
			<header class="title-row">
				<div class="title-stack">
					<span class="title-text">{{ t('licensing.restore_title') }}</span>
					<span class="subtitle">{{ t('licensing.restore_subtitle') }}</span>
				</div>
			</header>

			<VCardText>
				<ResolutionLimitSection
					v-if="collections && collections.candidates.length > 0"
					v-model="selected.collections"
					direction="restore"
					icon="database"
					:title="t('licensing.resolve_section_collections')"
					:usage="collections.usage"
					:limit="collections.limit"
					:groups="collectionGroups"
					:id-for="(collection: { id: string }) => collection.id"
				/>

				<ResolutionLimitSection
					v-if="seats && seats.candidates.length > 0"
					v-model="selected.seats"
					direction="restore"
					icon="group"
					:title="t('licensing.resolve_section_seats')"
					:usage="seatUsage + selected.sso_users.size"
					:limit="seats.limit"
					:groups="seatGroups"
					:id-for="(user: LicenseResolvedUser) => user.id"
					linkable
					@open-item="openUserDrawer"
				>
					<template #item="{ candidate }">
						<ResolutionUserItem :user="candidate" />
					</template>
				</ResolutionLimitSection>

				<ResolutionLimitSection
					v-if="flows && flows.candidates.length > 0"
					v-model="selected.flows"
					direction="restore"
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

				<template v-if="ssoUsers && ssoUsers.candidates.length > 0">
					<VNotice v-if="!ssoUsers.entitled" type="info" class="sso-notice">
						{{ t('licensing.restore_sso_not_entitled') }}
					</VNotice>

					<ResolutionLimitSection
						v-model="selected.sso_users"
						direction="restore"
						icon="lock"
						:title="t('licensing.restore_section_sso')"
						:usage="seatUsage + selected.seats.size"
						:limit="ssoUsers.limit"
						:groups="ssoGroups"
						:id-for="(user: LicenseResolvedUser) => user.id"
						:disabled-for="() => !ssoUsers!.entitled"
						linkable
						@open-item="openUserDrawer"
					>
						<template #item="{ candidate }">
							<ResolutionUserItem :user="candidate" />
						</template>
					</ResolutionLimitSection>
				</template>
			</VCardText>

			<footer class="action-row">
				<VButton secondary @click="close">{{ t('cancel') }}</VButton>
				<VButton :disabled="!isValid" :loading="submitting" @click="submit">
					{{ t('licensing.restore_submit') }}
				</VButton>
			</footer>

			<DrawerItem
				v-model:active="userDrawerActive"
				collection="directus_users"
				:primary-key="editingUserId || '+'"
				:selected-fields="['first_name', 'last_name', 'email', 'avatar', 'title', 'status', 'role', 'provider']"
				non-editable
			/>
		</VCard>
	</VDialog>
</template>

<style scoped>
.restore-card {
	--v-card-min-width: auto;
	inline-size: min(60rem, calc(100vw - 7rem));
	max-inline-size: none;
	block-size: auto;
	max-block-size: calc(100vh - 7rem);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.restore-card :deep(.v-card-text) {
	flex: 1;
	overflow-y: auto;
	padding-block-start: 1rem;
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

.subtitle {
	color: var(--theme--foreground-normal);
	font-weight: 500;
}

.action-row {
	display: flex;
	justify-content: flex-end;
	gap: 0.6875rem;
	padding: 1rem 1.75rem;
	border-block-start: 1px solid var(--theme--border-color-subdued);
}

.item-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.sso-notice {
	margin-block-start: 2rem;
}
</style>
