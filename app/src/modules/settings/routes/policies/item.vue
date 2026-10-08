<script setup lang="ts">
import { useShortcut } from '@directus/composables';
import { Policy } from '@directus/types';
import { ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import { getSystemPermissionChanges } from './get-system-permission-changes';
import PolicyInfoSidebarDetail from './policy-info-sidebar-detail.vue';
import PublicPolicyNotice from './public-policy-notice.vue';
import SystemPermissionsDialog from './system-permissions-dialog.vue';
import { useIsAttachedToPublicRole } from './use-is-attached-to-public-role';
import { useSystemPermissionsGuard } from './use-system-permissions-guard';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useUserStore } from '@/stores/user';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';

const props = defineProps<{
	primaryKey: string;
	permissionKey?: string;
}>();

const router = useRouter();

const userStore = useUserStore();
const { primaryKey } = toRefs(props);

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { edits, hasEdits, item, saving, loading, save, remove, deleting, validationErrors } = useItem<Policy>(
	ref('directus_policies'),
	primaryKey,
);

const isAttachedToPublicRole = useIsAttachedToPublicRole(primaryKey);

const {
	confirmSystemPermissions,
	changes: systemPermissionChanges,
	guardSave,
	confirmSave,
} = useSystemPermissionsGuard(
	() => (isAttachedToPublicRole.value ? getSystemPermissionChanges(edits.value.permissions) : []),
	saving,
);

const confirmDelete = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) guardSave(saveAndStay);
});

useShortcut('meta+shift+s', () => {
	if (hasEdits.value) guardSave(saveAndAddNew);
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

/**
 * @NOTE
 * The userStore contains the information about the role of the current user. We want to
 * update the userStore to make sure the role information is accurate with the latest changes
 * in case we're changing the current user's role
 */

async function saveAndStay() {
	try {
		await save();
		revisionsSidebarDetailRef.value?.refresh?.();
		await userStore.hydrate();
	} catch {
		// 'save' shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	try {
		await save();
		await userStore.hydrate();
		router.push({ name: 'settings-add-new-policy' });
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndQuit() {
	try {
		await save();
		await userStore.hydrate();
		router.push({ name: 'settings-policies-collection' });
	} catch {
		// 'save' shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		await remove();
		edits.value = {};
		router.replace({ name: 'settings-policies-collection' });
	} catch {
		// 'remove' shows unexpected error dialog
	}
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = {};
	confirmLeave.value = false;
	router.push(leaveTo.value);
}

function discardAndStay() {
	edits.value = {};
	confirmLeave.value = false;
}
</script>

<template>
	<PrivateView
		:title="loading ? $t('loading') : $t('editing_policy', { policy: item && item.name })"
		show-back
		back-to="/settings/policies"
	>
		<template #actions>
			<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="$t('delete_label')"
						kind="danger"
						variant="ghost"
						:disabled="item === null"
						icon="delete"
						@click="on"
					/>
				</template>

				<VCard>
					<VCardTitle>{{ $t('delete_are_you_sure') }}</VCardTitle>

					<VCardActions>
						<VButton secondary @click="confirmDelete = false">
							{{ $t('cancel') }}
						</VButton>
						<VButton kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ $t('delete_label') }}
						</VButton>
					</VCardActions>
				</VCard>
			</VDialog>
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('save')"
				icon="check"
				:loading="saving"
				:disabled="!hasEdits"
				@click="guardSave(saveAndQuit)"
			>
				<template #split-menu>
					<SaveOptions
						:disabled-options="['save-and-quit', 'save-as-copy']"
						@save-and-stay="guardSave(saveAndStay)"
						@save-and-add-new="guardSave(saveAndAddNew)"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="content">
			<PublicPolicyNotice v-if="isAttachedToPublicRole" />

			<VForm
				v-model="edits"
				collection="directus_policies"
				:primary-key="primaryKey"
				:loading
				:initial-values="item"
				:validation-errors="validationErrors"
			/>
		</div>

		<template #sidebar>
			<PolicyInfoSidebarDetail :policy="item" />
			<RevisionsSidebarDetail
				ref="revisionsSidebarDetailRef"
				collection="directus_policies"
				:primary-key="primaryKey"
			/>
		</template>

		<SystemPermissionsDialog
			v-model="confirmSystemPermissions"
			:changes="systemPermissionChanges"
			:saving
			@confirm="confirmSave"
		/>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color: var(--theme--primary-background);
	--v-button-color: var(--theme--primary);
	--v-button-background-color-hover: var(--theme--primary-subdued);
	--v-button-color-hover: var(--theme--primary);
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	display: flex;
	flex-direction: column;
	row-gap: var(--theme--form--row-gap);
}
</style>
