<template>
	<private-view :title="loading ? t('loading') : t('editing_role', { role: item && item.name })">
		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings_permissions'), to: '/settings/roles' }]" />
		</template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact :to="`/settings/roles/`">
				<v-icon name="arrow_back" />
			</v-button>
		</template>
		<template #actions>
			<v-dialog v-if="[1, 2].includes(+primaryKey) === false" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-if="primaryKey !== lastAdminRoleId"
						v-tooltip.bottom="t('delete_label')"
						rounded
						icon
						class="action-delete"
						secondary
						:disabled="item === null"
						@click="on"
					>
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="deleting" @click="deleteAndQuit">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-if="canInviteUsers"
				v-tooltip.bottom="t('invite_users')"
				rounded
				icon
				secondary
				@click="userInviteModalActive = true"
			>
				<v-icon name="person_add" />
			</v-button>

			<v-button
				v-tooltip.bottom="t('save')"
				rounded
				icon
				:loading="saving"
				:disabled="hasEdits === false"
				@click="saveAndQuit"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<users-invite v-model="userInviteModalActive" :role="primaryKey" />

		<div class="roles">
			<v-notice v-if="adminEnabled" type="info">
				{{ t('admins_have_all_permissions') }}
			</v-notice>

			<permissions-overview v-else :role="primaryKey" :permission="permissionKey" :app-access="appAccess" />

			<v-form
				v-model="edits"
				collection="directus_roles"
				:primary-key="primaryKey"
				:loading="loading"
				:initial-values="item"
				:batch-mode="isBatch"
			/>
		</div>

		<template #sidebar>
			<role-info-sidebar-detail :role="item" />
			<revisions-drawer-detail collection="directus_roles" :primary-key="primaryKey" />
		</template>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

import { useEditsGuard } from '@/composables/use-edits-guard';
import { useItem } from '@/composables/use-item';
import { useShortcut } from '@/composables/use-shortcut';
import { usePermissionsStore } from '@/stores/permissions';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import RevisionsDrawerDetail from '@/views/private/components/revisions-drawer-detail.vue';
import UsersInvite from '@/views/private/components/users-invite.vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';
import PermissionsOverview from './components/permissions-overview.vue';
import RoleInfoSidebarDetail from './components/role-info-sidebar-detail.vue';

export default defineComponent({
	name: 'RolesItem',
	components: { SettingsNavigation, RevisionsDrawerDetail, RoleInfoSidebarDetail, PermissionsOverview, UsersInvite },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
		permissionKey: {
			type: String,
			default: null,
		},
		lastAdminRoleId: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const router = useRouter();

		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();
		const serverStore = useServerStore();
		const userInviteModalActive = ref(false);
		const { primaryKey } = toRefs(props);

		const { edits, hasEdits, item, saving, loading, error, save, remove, deleting, isBatch } = useItem(
			ref('directus_roles'),
			primaryKey,
			{ deep: { users: { _limit: 0 } } }
		);

		const confirmDelete = ref(false);

		const adminEnabled = computed(() => {
			const values = {
				...item.value,
				...edits.value,
			} as Record<string, any>;

			return !!values.admin_access;
		});

		const appAccess = computed(() => {
			const values = {
				...item.value,
				...edits.value,
			} as Record<string, any>;

			return !!values.app_access;
		});

		useShortcut('meta+s', () => {
			if (hasEdits.value) saveAndStay();
		});

		const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

		const canInviteUsers = computed(() => {
			if (serverStore.auth.disableDefault === true) return false;

			const isAdmin = !!userStore.currentUser?.role?.admin_access;
			if (isAdmin) return true;

			const usersCreatePermission = permissionsStore.permissions.find(
				(permission) => permission.collection === 'directus_users' && permission.action === 'create'
			);
			const rolesReadPermission = permissionsStore.permissions.find(
				(permission) => permission.collection === 'directus_roles' && permission.action === 'read'
			);

			return !!usersCreatePermission && !!rolesReadPermission;
		});

		return {
			t,
			item,
			loading,
			error,
			edits,
			hasEdits,
			saving,
			saveAndQuit,
			deleteAndQuit,
			confirmDelete,
			deleting,
			isBatch,
			adminEnabled,
			userInviteModalActive,
			appAccess,
			confirmLeave,
			leaveTo,
			discardAndLeave,
			canInviteUsers,
		};

		/**
		 * @NOTE
		 * The userStore contains the information about the role of the current user. We want to
		 * update the userstore to make sure the role information is accurate with the latest changes
		 * in case we're changing the current user's role
		 */

		async function saveAndStay() {
			await save();
			await userStore.hydrate();
		}

		async function saveAndQuit() {
			await save();
			await userStore.hydrate();
			router.push(`/settings/roles`);
		}

		async function deleteAndQuit() {
			await remove();
			router.replace(`/settings/roles`);
		}

		function discardAndLeave() {
			if (!leaveTo.value) return;
			edits.value = {};
			confirmLeave.value = false;
			router.push(leaveTo.value);
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.roles {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.v-notice,
.v-skeleton-loader {
	max-width: 800px;
}

.header-icon {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}

.permissions-overview,
.roles .v-notice {
	margin-bottom: 48px;
}
</style>
