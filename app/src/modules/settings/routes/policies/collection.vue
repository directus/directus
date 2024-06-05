<script setup lang="ts">
import { Header as TableHeader } from '@/components/v-table/types';
import { fetchAll } from '@/utils/fetch-all';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import SearchInput from '@/views/private/components/search-input.vue';
import { Policy } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';

// Taken from 20240328A-permissions-policies.ts
const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';

type PolicyBaseFields = 'id' | 'name' | 'description';

type PolicyResponse = Pick<Policy, PolicyBaseFields | 'admin_access'> & {
	users: [{ count: { id: number } }];
};

type PolicyItem = Pick<Policy, PolicyBaseFields> &
	Partial<Pick<Policy, 'admin_access'>> & {
		public?: boolean;
		userCount?: number;
		roleCount?: number;
		icon?: string;
	};

const { t } = useI18n();

const router = useRouter();

const policies = ref<PolicyItem[]>([]);
const loading = ref(false);

// Todo make this use a util endpoint for determining if a policy can be deleted
const lastAdminPolicyId = computed(() => {
	const adminPolicies = policies.value.filter((role) => role.admin_access === true);
	return adminPolicies.length === 1 ? (adminPolicies[0] as PolicyItem).id : null;
});

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

	try {
		const response = await fetchAll<PolicyResponse>(`/policies`, {
			params: {
				limit: -1,
				fields: ['id', 'name', 'description', 'admin_access'],
				// deep: {
				// 	users: {
				// 		_aggregate: { count: 'id' },
				// 		_groupBy: ['role'],
				// 		_sort: 'role',
				// 		_limit: -1,
				// 	},
				// },
				sort: 'name',
			},
		});

		policies.value = response.map((policy) => {
			let icon = 'badge';
			if (policy.admin_access) icon = 'verified';
			if (policy.id === PUBLIC_POLICY_ID) icon = 'public';

			return {
				...translate(policy),
				public: policy.id === PUBLIC_POLICY_ID,
				icon,
			};
		});

		policies.value.sort((a, b) => {
			if (a.public && !b.public) return -1;
			if (!a.public && b.public) return 1;
			return a.name.localeCompare(b.name);
		});
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

function navigateToPolicy({ item }: { item: Policy }) {
	if (item.id !== 'public' && lastAdminPolicyId.value) {
		router.push({
			name: 'settings-policies-item',
			params: { primaryKey: item.id, lastAdminPolicyId: lastAdminPolicyId.value },
		});
	} else {
		router.push(`/settings/policies/${item.id}`);
	}
}
</script>

<template>
	<private-view :title="t('settings_permissions')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="badge" />
			</v-button>
		</template>

		<template #actions>
			<search-input
				v-if="!loading"
				v-model="search"
				:autofocus="policies.length > 25"
				:placeholder="t('search_policy')"
				:show-filter="false"
			/>

			<v-button v-tooltip.bottom="t('create_policy')" rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_policies_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<div v-if="!search || filteredPolicies.length > 0" class="policies">
			<v-table
				v-model:headers="tableHeaders"
				show-resize
				:items="filteredPolicies"
				fixed-header
				item-key="id"
				:loading="loading"
				@click:row="navigateToPolicy"
			>
				<template #[`item.icon`]="{ item }">
					<v-icon class="icon" :name="item.icon" :class="{ public: item.public }" />
				</template>

				<template #[`item.name`]="{ item }">
					<v-text-overflow :text="item.name" class="name" :class="{ public: item.public }" :highlight="search" />
				</template>

				<template #[`item.count`]="{ item }">
					<value-null v-if="item.public" />
				</template>

				<template #[`item.description`]="{ item }">
					<v-text-overflow :text="item.description" class="description" :highlight="search" />
				</template>
			</v-table>
		</div>

		<v-info v-else icon="search" :title="t('no_results')" center>
			{{ t('no_results_copy') }}

			<template #append>
				<v-button @click="search = null">{{ t('clear_filters') }}</v-button>
			</template>
		</v-info>

		<router-view name="add" />
	</private-view>
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
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);
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
