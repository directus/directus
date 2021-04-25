<template>
	<private-view :title="$t('settings_permissions')">
		<template #headline>{{ $t('settings') }}</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="admin_panel_settings" outline />
			</v-button>
		</template>

		<template #actions>
			<v-button rounded icon :to="addNewLink" v-tooltip.bottom="$t('create_role')">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_settings_roles_collection'))" />
			</sidebar-detail>
		</template>

		<div class="roles">
			<v-table
				:items="roles"
				:headers="tableHeaders"
				fixed-header
				item-key="id"
				:loading="loading"
				@click:row="navigateToRole"
			>
				<template #item.icon="{ item }">
					<v-icon class="icon" :name="item.icon" :class="{ public: item.public }" />
				</template>

				<template #item.name="{ item }">
					<span class="name" :class="{ public: item.public }">
						{{ item.name }}
					</span>
				</template>

				<template #item.count="{ item }">
					<value-null v-if="item.public" />
				</template>

				<template #item.description="{ item }">
					<span class="description">{{ item.description }}</span>
				</template>
			</v-table>
		</div>
		<router-view name="add" />
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import SettingsNavigation from '../../components/navigation.vue';

import { i18n } from '@/lang';
import api from '@/api';
import marked from 'marked';
import { Header as TableHeader } from '@/components/v-table/types';
import ValueNull from '@/views/private/components/value-null';
import router from '@/router';
import { unexpectedError } from '@/utils/unexpected-error';

type Role = {
	id: number;
	name: string;
	description: string;
	count: number;
};

export default defineComponent({
	name: 'roles-collection',
	components: { SettingsNavigation, ValueNull },
	props: {},
	setup() {
		const roles = ref<Role[]>([]);
		const loading = ref(false);

		const tableHeaders: TableHeader[] = [
			{
				text: '',
				value: 'icon',
				sortable: false,
				width: 42,
				align: 'left',
			},
			{
				text: i18n.t('name'),
				value: 'name',
				sortable: false,
				width: 140,
				align: 'left',
			},
			{
				text: i18n.t('users'),
				value: 'count',
				sortable: false,
				width: 140,
				align: 'left',
			},
			{
				text: i18n.t('description'),
				value: 'description',
				sortable: false,
				width: 470,
				align: 'left',
			},
		];

		fetchRoles();

		const addNewLink = computed(() => {
			return `/settings/roles/+`;
		});

		return { marked, loading, roles, tableHeaders, addNewLink, navigateToRole };

		async function fetchRoles() {
			loading.value = true;

			try {
				const response = await api.get(`/roles`, {
					params: { limit: -1, fields: 'id,name,description,icon,users.id', sort: 'name' },
				});

				roles.value = [
					{
						public: true,
						name: i18n.t('public'),
						icon: 'public',
						description: i18n.t('public_description'),
						id: 'public',
					},
					...response.data.data.map((role: any) => {
						return {
							...role,
							count: (role.users || []).length,
						};
					}),
				];
			} catch (err) {
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}

		function navigateToRole(item: Role) {
			router.push(`/settings/roles/${item.id}`);
		}
	},
});
</script>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-10);
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
