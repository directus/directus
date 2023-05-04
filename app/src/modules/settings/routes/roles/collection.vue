<template>
	<private-view :title="t('settings_permissions')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="admin_panel_settings" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="t('create_role')" rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_roles_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<div class="roles">
			<v-table
				v-model:headers="tableHeaders"
				show-resize
				:items="roles"
				fixed-header
				item-key="id"
				:loading="loading"
				@click:row="navigateToRole"
			>
				<template #[`item.icon`]="{ item }">
					<v-icon class="icon" :name="item.icon" :class="{ public: item.public }" />
				</template>

				<template #[`item.name`]="{ item }">
					<v-text-overflow :text="item.name" class="name" :class="{ public: item.public }" />
				</template>

				<template #[`item.count`]="{ item }">
					<value-null v-if="item.public" />
				</template>

				<template #[`item.description`]="{ item }">
					<v-text-overflow :text="item.description" class="description" />
				</template>
			</v-table>
		</div>
		<router-view name="add" />
	</private-view>
</template>

<script setup lang="ts">
import { Header as TableHeader } from '@/components/v-table/types';
import { fetchAll } from '@/utils/fetch-all';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { Role } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

type RoleItem = Partial<Role> & {
	count?: number;
};

const { t } = useI18n();

const router = useRouter();

const roles = ref<RoleItem[]>([]);
const loading = ref(false);

const lastAdminRoleId = computed(() => {
	const adminRoles = roles.value.filter((role) => role.admin_access === true);
	return adminRoles.length === 1 ? adminRoles[0].id : null;
});

const tableHeaders = ref<TableHeader[]>([
	{
		text: '',
		value: 'icon',
		sortable: false,
		width: 42,
		align: 'left',
		description: null,
	},
	{
		text: t('name'),
		value: 'name',
		sortable: false,
		width: 200,
		align: 'left',
		description: null,
	},
	{
		text: t('users'),
		value: 'count',
		sortable: false,
		width: 140,
		align: 'left',
		description: null,
	},
	{
		text: t('description'),
		value: 'description',
		sortable: false,
		width: 470,
		align: 'left',
		description: null,
	},
]);

fetchRoles();

const addNewLink = computed(() => {
	return `/settings/roles/+`;
});

async function fetchRoles() {
	loading.value = true;

	try {
		const response = await fetchAll<any[]>(`/roles`, {
			params: {
				limit: -1,
				fields: ['id', 'name', 'description', 'icon', 'admin_access', 'users'],
				deep: {
					users: {
						_aggregate: { count: 'id' },
						_groupBy: ['role'],
						_sort: 'role',
						_limit: -1,
					},
				},
				sort: 'name',
			},
		});

		roles.value = [
			{
				public: true,
				name: t('public_label'),
				icon: 'public',
				description: t('public_description'),
				id: 'public',
			},
			...response.map((role: any) => {
				return {
					...translate(role),
					count: role.users[0]?.count.id || 0,
				};
			}),
		];
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
}

function navigateToRole({ item }: { item: Role }) {
	if (item.id !== 'public' && lastAdminRoleId.value) {
		router.push({
			name: 'settings-roles-item',
			params: { primaryKey: item.id, lastAdminRoleId: lastAdminRoleId.value },
		});
	} else {
		router.push(`/settings/roles/${item.id}`);
	}
}
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
	--v-button-background-color-hover-disabled: var(--primary-25);
	--v-button-color-hover-disabled: var(--primary);
}

.roles {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
}

.system {
	--v-icon-color: var(--primary);

	color: var(--primary);
}

.description {
	color: var(--foreground-subdued);
}

.public {
	--v-icon-color: var(--primary);

	color: var(--primary);
}
</style>
