<script setup lang="ts">
import api from '@/api';
import { useExtension } from '@/composables/use-extension';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { usePreset } from '@/composables/use-preset';
import { useServerStore } from '@/stores/server';
import { unexpectedError } from '@/utils/unexpected-error';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import UsersInvite from '@/views/private/components/users-invite.vue';
import { useLayout } from '@directus/composables';
import { mergeFilters } from '@directus/utils';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import UsersNavigation from '../components/navigation.vue';
import useNavigation from '../composables/use-navigation';
import { logout } from '@/auth';
import { useUserStore } from '@/stores/user';

const props = defineProps<{ role?: string }>();

const { role } = toRefs(props);

const { t } = useI18n();
const { roles } = useNavigation(role);
const userInviteModalActive = ref(false);
const serverStore = useServerStore();
const userStore = useUserStore();

const layoutRef = ref();
const selection = ref<string[]>([]);

const { layout, layoutOptions, layoutQuery, filter, search, resetPreset } = usePreset(ref('directus_users'));
const { addNewLink } = useLinks();

const currentLayout = useExtension('layout', layout);

const { confirmDelete, deleting, batchDelete, batchEditActive } = useBatch();

const { breadcrumb, title } = useBreadcrumb();

const roleFilter = computed(() => {
	if (props.role) {
		return {
			_and: [
				{
					role: {
						_eq: props.role,
					},
				},
			],
		};
	}

	return null;
});

const {
	createAllowed,
	updateAllowed: batchEditAllowed,
	deleteAllowed: batchDeleteAllowed,
} = useCollectionPermissions('directus_users');

const { readAllowed: rolesReadAllowed } = useCollectionPermissions('directus_roles');

const canInviteUsers = computed(() => {
	if (serverStore.auth.disableDefault === true) return false;

	return createAllowed.value && rolesReadAllowed.value;
});

const { layoutWrapper } = useLayout(layout);

onBeforeRouteLeave(() => {
	selection.value = [];
});

onBeforeRouteUpdate(() => {
	selection.value = [];
});

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

function useBatch() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	const batchEditActive = ref(false);

	const error = ref<any>();

	return { batchEditActive, confirmDelete, deleting, batchDelete, error };

	async function batchDelete() {
		if (deleting.value) return;

		deleting.value = true;

		const batchPrimaryKeys = selection.value;

		try {
			await api.delete('/users', {
				data: batchPrimaryKeys,
			});

			// Check if the current user was among the deleted users
			const currentUserId = userStore.currentUser && 'id' in userStore.currentUser ? userStore.currentUser.id : null;

			if (
				currentUserId &&
				batchPrimaryKeys.some((key) => {
					return key === currentUserId;
				})
			) {
				await logout();
				return;
			}

			await refresh();

			selection.value = [];
			confirmDelete.value = false;
		} catch (e) {
			error.value = e;
			unexpectedError(e);
		} finally {
			deleting.value = false;
		}
	}
}

function useLinks() {
	const addNewLink = computed<string>(() => {
		return props.role ? `/users/roles/${props.role}/+` : '/users/+';
	});

	return { addNewLink };
}

function useBreadcrumb() {
	const breadcrumb = computed(() => {
		if (!props.role) return null;

		return [
			{
				name: t('user_directory'),
				to: `/users`,
			},
		];
	});

	const title = computed(() => {
		if (!props.role) return t('user_directory');
		return roles.value?.find((role) => role.id === props.role)?.name;
	});

	return { breadcrumb, title };
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}
</script>

<template>
	<component
		:is="layoutWrapper"
		ref="layoutRef"
		v-slot="{ layoutState }"
		v-model:selection="selection"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter="mergeFilters(filter, roleFilter)"
		:filter-user="filter"
		:filter-system="roleFilter"
		:search="search"
		collection="directus_users"
		:reset-preset="resetPreset"
	>
		<private-view
			:title="title"
			:small-header="currentLayout?.smallHeader"
			:header-shadow="currentLayout?.headerShadow"
		>
			<template v-if="breadcrumb" #headline>
				<v-breadcrumb :items="breadcrumb" />
			</template>

			<template #title-outer:prepend>
				<v-button class="header-icon" rounded disabled icon secondary>
					<v-icon name="people_alt" />
				</v-button>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="search" v-model:filter="filter" collection="directus_users" />

				<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="batchDeleteAllowed ? $t('delete_label') : $t('not_allowed')"
							:disabled="batchDeleteAllowed !== true"
							rounded
							icon
							class="action-delete"
							secondary
							@click="on"
						>
							<v-icon name="delete" />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ $t('batch_delete_confirm', selection.length) }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</v-button>
							<v-button kind="danger" :loading="deleting" @click="batchDelete">
								{{ $t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-if="selection.length > 0"
					v-tooltip.bottom="batchEditAllowed ? $t('edit') : $t('not_allowed')"
					rounded
					icon
					secondary
					:disabled="batchEditAllowed === false"
					@click="batchEditActive = true"
				>
					<v-icon name="edit" />
				</v-button>

				<v-button
					v-if="canInviteUsers"
					v-tooltip.bottom="$t('invite_users')"
					rounded
					icon
					secondary
					@click="userInviteModalActive = true"
				>
					<v-icon name="person_add" />
				</v-button>

				<v-button
					v-tooltip.bottom="createAllowed ? $t('create_item') : $t('not_allowed')"
					rounded
					icon
					:to="addNewLink"
					:disabled="createAllowed === false"
				>
					<v-icon name="add" />
				</v-button>
			</template>

			<template #navigation>
				<users-navigation :current-role="role" />
			</template>

			<users-invite v-if="canInviteUsers" v-model="userInviteModalActive" @update:model-value="refresh" />

			<component :is="`layout-${layout}`" v-bind="layoutState">
				<template #no-results>
					<v-info v-if="!filter && !search" :title="$t('user_count', 0)" icon="people_alt" center>
						{{ $t('no_users_copy') }}

						<template v-if="canInviteUsers" #append>
							<v-button :to="role ? { path: `/users/roles/${role}/+` } : { path: '/users/+' }">
								{{ $t('create_user') }}
							</v-button>
						</template>
					</v-info>

					<v-info v-else :title="$t('no_results')" icon="search" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
						</template>
					</v-info>
				</template>

				<template #no-items>
					<v-info :title="$t('user_count', 0)" icon="people_alt" center>
						{{ $t('no_users_copy') }}

						<template v-if="canInviteUsers" #append>
							<v-button :to="role ? { path: `/users/roles/${role}/+` } : { path: '/users/+' }">
								{{ $t('create_user') }}
							</v-button>
						</template>
					</v-info>
				</template>
			</component>

			<drawer-batch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				collection="directus_users"
				@refresh="refresh"
			/>

			<template #sidebar>
				<sidebar-detail icon="info" :title="$t('information')" close>
					<div v-md="$t('page_help_users_collection')" class="page-description" />
				</sidebar-detail>
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout}`" v-bind="layoutState" />
				<export-sidebar-detail
					collection="directus_users"
					:layout-query="layoutQuery"
					:filter="mergeFilters(filter, roleFilter)"
					:search="search"
					@refresh="refresh"
				/>
			</template>
		</private-view>
	</component>
</template>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}
</style>
