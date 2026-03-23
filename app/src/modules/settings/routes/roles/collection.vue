<script setup lang="ts">
import { Role } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView, useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import { Header as TableHeader } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { fetchAll } from '@/utils/fetch-all';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import RenderDisplay from '@/views/private/components/render-display.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import ValueNull from '@/views/private/components/value-null.vue';

const { t } = useI18n();

type RoleBaseFields = 'id' | 'name' | 'description' | 'icon';

type RoleResponse = Pick<Role, RoleBaseFields> & {
	users: [{ count: { id: number } }];
};

type RoleItem = Pick<Role, RoleBaseFields> & {
	public?: boolean;
	count?: number;
};

const router = useRouter();

const roles = ref<RoleItem[]>([]);
const loading = ref(false);

const search = ref<string | null>(null);

const filteredRoles = computed(() => {
	const normalizedSearch = search.value?.toLowerCase();
	if (!normalizedSearch) return roles.value;
	return roles.value.filter(
		(role) =>
			role.name?.toLowerCase().includes(normalizedSearch) || role.description?.toLowerCase().includes(normalizedSearch),
	);
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
		text: t('fields.directus_roles.children'),
		display: 'related-values',
		displayOptions: {
			template: '{{ name }}',
		},
		field: 'children',
		collection: 'directus_roles',
		value: 'children',
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
		const response = await fetchAll<RoleResponse>(`/roles`, {
			params: {
				limit: -1,
				fields: ['id', 'name', 'description', 'icon', 'users', 'children.name', 'children.id'],
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
				id: 'public',
				name: t('public_label'),
				description: t('public_description'),
				icon: 'public',
				public: true,
			},
			...response.map((role) => {
				return {
					...translate(role),
					count: role.users[0]?.count.id || 0,
				};
			}),
		];
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function navigateToRole({ item }: { item: Role }) {
	if (item.id === 'public') {
		router.push({ name: 'settings-roles-public-item' });
		return;
	} else {
		router.push({
			name: 'settings-roles-item',
			params: { primaryKey: item.id },
		});
	}
}
</script>

<template>
	<PrivateView :title="$t('settings_roles')" icon="group">
		<template #headline><VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #actions>
			<SearchInput
				v-if="!loading"
				v-model="search"
				:autofocus="roles.length > 25"
				:placeholder="$t('search_role')"
				:show-filter="false"
				small
			/>

			<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('create_role')" :to="addNewLink" icon="add" />
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div v-if="!search || filteredRoles.length > 0" class="roles">
			<VTable
				v-model:headers="tableHeaders"
				show-resize
				:items="filteredRoles"
				fixed-header
				item-key="id"
				:loading="loading"
				@click:row="navigateToRole"
			>
				<template #[`item.icon`]="{ item }">
					<VIcon class="icon" :name="item.icon" :class="{ public: item.public }" />
				</template>

				<template #[`item.name`]="{ item }">
					<VTextOverflow :text="item.name" class="name" :highlight="search" :class="{ public: item.public }" />
				</template>

				<template #[`item.count`]="{ item }">
					<ValueNull v-if="item.public" />
				</template>

				<template #[`item.description`]="{ item }">
					<VTextOverflow :text="item.description" class="description" :highlight="search" />
				</template>

				<template #[`item.children`]="{ item }">
					<ValueNull v-if="item.public || item.children.length === 0" />
					<RenderDisplay
						v-else
						:value="item.children"
						:display="tableHeaders[3]!.display"
						:options="tableHeaders[3]!.displayOptions"
						:field="tableHeaders[3]!.field"
						:collection="tableHeaders[3]!.collection"
					/>
				</template>
			</VTable>
		</div>

		<VInfo v-else icon="search" :title="$t('no_results')" center>
			{{ $t('no_results_copy') }}

			<template #append>
				<VButton @click="search = null">{{ $t('clear_filters') }}</VButton>
			</template>
		</VInfo>

		<RouterView name="add" />
	</PrivateView>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}

.roles {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.system {
	--v-icon-color: var(--theme--primary);

	color: var(--theme--primary);
}

.description {
	--v-highlight-color: var(--theme--background-accent);

	color: var(--theme--foreground-subdued);
}

.public {
	--v-icon-color: var(--theme--primary);

	color: var(--theme--primary);
}
</style>
