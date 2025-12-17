<script setup lang="ts">
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
import SearchInput from '@/views/private/components/search-input.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import { Policy } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView, useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

type PolicyBaseFields = 'id' | 'name' | 'icon' | 'description';

type PolicyResponse = Pick<Policy, PolicyBaseFields> & {
	users: [{ count: { user: number } }];
	roles: [{ count: { role: number } }];
};

type PolicyItem = Pick<Policy, PolicyBaseFields> & {
	userCount?: number;
	roleCount?: number;
};

const { t } = useI18n();

const router = useRouter();

const policies = ref<PolicyItem[]>([]);
const loading = ref(false);

const search = ref<string | null>(null);

const filteredPolicies = computed(() => {
	const normalizedSearch = search.value?.toLowerCase();
	if (!normalizedSearch) return policies.value;
	return policies.value.filter(
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
		value: 'userCount',
		sortable: false,
		width: 100,
		align: 'left',
		description: null,
	},
	{
		text: t('roles'),
		value: 'roleCount',
		sortable: false,
		width: 100,
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

fetchPolicies();

const addNewLink = computed(() => {
	return `/settings/policies/+`;
});

async function fetchPolicies() {
	loading.value = true;

	// TODO since there might be a query limit enforced in the API we either need pagination or a fetch more
	try {
		const response = await fetchAll<PolicyResponse>(`/policies`, {
			params: {
				limit: -1,
				fields: ['id', 'name', 'icon', 'description', 'admin_access', 'users', 'roles'],
				deep: {
					users: {
						_aggregate: { count: 'user' },
						_groupBy: ['policy'],
						_sort: 'policy',
						_limit: -1,
					},
					roles: {
						_aggregate: { count: 'role' },
						_groupBy: ['policy'],
						_sort: 'policy',
						_limit: -1,
					},
				},
				sort: 'name',
			},
		});

		policies.value = response.map((policy) => {
			return {
				...translate(policy),
				userCount: policy.users?.[0]?.count.user ?? 0,
				roleCount: policy.roles?.[0]?.count.role ?? 0,
			};
		});

		policies.value.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function navigateToPolicy({ item }: { item: Policy }) {
	router.push(`/settings/policies/${item.id}`);
}
</script>

<template>
	<PrivateView :title="$t('settings_permissions')" icon="admin_panel_settings">
		<template #headline><VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #actions>
			<SearchInput
				v-if="!loading"
				v-model="search"
				:autofocus="policies.length > 25"
				:placeholder="$t('search_policy')"
				:show-filter="false"
				small
			/>

			<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('create_policy')" :to="addNewLink" icon="add" />
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div v-if="!search || filteredPolicies.length > 0" class="policies">
			<VTable
				v-model:headers="tableHeaders"
				show-resize
				:items="filteredPolicies"
				fixed-header
				item-key="id"
				:loading="loading"
				@click:row="navigateToPolicy"
			>
				<template #[`item.icon`]="{ item }">
					<VIcon class="icon" :name="item.icon" />
				</template>

				<template #[`item.name`]="{ item }">
					<VTextOverflow v-if="item.name" :text="item.name" class="name" :highlight="search" />
				</template>

				<template #[`item.description`]="{ item }">
					<VTextOverflow v-if="item.description" :text="item.description" class="description" :highlight="search" />
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

.policies {
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
</style>
