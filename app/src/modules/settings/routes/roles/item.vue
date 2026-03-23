<script setup lang="ts">
import { Role } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import RoleInfoSidebarDetail from './role-info-sidebar-detail.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import RevisionsSidebarDetail from '@/views/private/components/revisions-sidebar-detail.vue';
import SaveOptions from '@/views/private/components/save-options.vue';
import UsersInvite from '@/views/private/components/users-invite.vue';

const props = defineProps<{
	primaryKey: string;
	permissionKey?: string;
}>();

const router = useRouter();

const userStore = useUserStore();
const serverStore = useServerStore();
const userInviteModalActive = ref(false);
const { primaryKey } = toRefs(props);

const revisionsSidebarDetailRef = ref<InstanceType<typeof RevisionsSidebarDetail> | null>(null);

const { edits, hasEdits, item, saving, loading, save, remove, deleting, validationErrors } = useItem<Role>(
	ref('directus_roles'),
	primaryKey,
	{
		deep: { users: { _limit: 0 } },
	},
);

const canInviteUsers = computed(() => !serverStore.auth.disableDefault);

const confirmDelete = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) saveAndStay();
});

useShortcut('meta+shift+s', () => {
	if (hasEdits.value) saveAndAddNew();
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
		await userStore.hydrate();
		revisionsSidebarDetailRef.value?.refresh?.();
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndAddNew() {
	try {
		await save();
		await userStore.hydrate();
		router.push(`/settings/roles/+`);
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function saveAndQuit() {
	try {
		await save();
		await userStore.hydrate();
		router.push(`/settings/roles`);
	} catch {
		// `save` shows unexpected error dialog
	}
}

async function deleteAndQuit() {
	if (deleting.value) return;

	try {
		await remove();
		edits.value = {};
		router.replace(`/settings/roles`);
	} catch {
		// `remove` shows unexpected error dialog
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
		:title="loading ? $t('loading') : $t('editing_role', { role: item && item.name })"
		show-back
		back-to="/settings/roles"
	>
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('settings_roles'), to: '/settings/roles' }]" />
		</template>

		<template #actions>
			<VDialog v-model="confirmDelete" @esc="confirmDelete = false" @apply="deleteAndQuit">
				<template #activator="{ on }">
					<PrivateViewHeaderBarActionButton
						v-tooltip.bottom="$t('delete_label')"
						class="action-delete"
						secondary
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

			<PrivateViewHeaderBarActionButton
				v-if="canInviteUsers"
				v-tooltip.bottom="$t('invite_users')"
				secondary
				icon="person_add"
				@click="userInviteModalActive = true"
			/>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:loading="saving"
				:disabled="!hasEdits"
				icon="check"
				@click="saveAndQuit"
			>
				<template #append-outer>
					<SaveOptions
						v-if="hasEdits"
						:disabled-options="['save-as-copy']"
						@save-and-stay="saveAndStay"
						@save-and-add-new="saveAndAddNew"
						@discard-and-stay="discardAndStay"
					/>
				</template>
			</PrivateViewHeaderBarActionButton>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<UsersInvite v-model="userInviteModalActive" :role="primaryKey" />

		<div class="content">
			<VForm
				v-model="edits"
				collection="directus_roles"
				:primary-key="primaryKey"
				:loading
				:initial-values="item"
				:validation-errors="validationErrors"
			/>
		</div>

		<template #sidebar>
			<RoleInfoSidebarDetail :role="item" />
			<RevisionsSidebarDetail ref="revisionsSidebarDetailRef" collection="directus_roles" :primary-key="primaryKey" />
		</template>

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

.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
