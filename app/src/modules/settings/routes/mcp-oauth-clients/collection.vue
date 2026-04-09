<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import type { HeaderRaw } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateView } from '@/views/private';
import SearchInput from '@/views/private/components/search-input.vue';

const { t } = useI18n();
const router = useRouter();

type ClientRow = {
	client_id: string;
	client_name: string;
	redirect_uris: string[];
	date_created: string;
	tokens: { count: { id: number } }[];
};

const loading = ref(false);
const clients = ref<ClientRow[]>([]);
const search = ref<string | null>(null);
const confirmRevoke = ref<string | null>(null);
const showRevokeDialog = computed(() => confirmRevoke.value !== null);
const revoking = ref(false);

const tableHeaders = ref<HeaderRaw[]>([
	{ text: t('client_name'), value: 'client_name', width: 200, sortable: false, align: 'left', description: null },
	{ text: t('client_id'), value: 'client_id', width: 280, sortable: false, align: 'left', description: null },
	{
		text: t('redirect_uris'),
		value: 'redirect_uris_display',
		width: 200,
		sortable: false,
		align: 'left',
		description: null,
	},
	{ text: t('date_created'), value: 'date_created', width: 160, sortable: false, align: 'left', description: null },
	{ text: t('active_tokens'), value: 'token_count', width: 120, sortable: false, align: 'left', description: null },
	{ text: '', value: 'actions', width: 60, sortable: false, align: 'left', description: null },
]);

const rows = computed(() =>
	clients.value.map((client) => ({
		...client,
		token_count: client.tokens?.[0]?.count?.id ?? 0,
		redirect_uris_display: client.redirect_uris?.join(', ') ?? '',
	})),
);

const filteredRows = computed(() => {
	const normalizedSearch = search.value?.toLowerCase();
	if (!normalizedSearch) return rows.value;
	return rows.value.filter(
		(row) =>
			row.client_name?.toLowerCase().includes(normalizedSearch) ||
			row.client_id?.toLowerCase().includes(normalizedSearch),
	);
});

fetchClients();

async function fetchClients() {
	loading.value = true;

	try {
		const response = await fetchAll<ClientRow>('/mcp-oauth/clients', {
			params: {
				limit: -1,
				fields: ['client_id', 'client_name', 'redirect_uris', 'date_created', 'tokens'],
				deep: {
					tokens: {
						_aggregate: { count: 'id' },
						_groupBy: ['client'],
						_sort: 'client',
						_limit: -1,
					},
				},
				sort: '-date_created',
			},
		});

		clients.value = response;
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}

async function revokeClient() {
	if (!confirmRevoke.value) return;
	revoking.value = true;

	try {
		await api.delete(`/mcp-oauth/clients/${confirmRevoke.value}`);
		clients.value = clients.value.filter((c) => c.client_id !== confirmRevoke.value);
	} catch (error) {
		unexpectedError(error);
	} finally {
		confirmRevoke.value = null;
		revoking.value = false;
	}
}
</script>

<template>
	<PrivateView :title="$t('mcp_oauth_clients')" icon="key" show-back back-to="/settings/ai">
		<template #headline>
			<VBreadcrumb
				:items="[
					{ name: $t('settings'), to: '/settings' },
					{ name: $t('settings_ai'), to: '/settings/ai' },
				]"
			/>
		</template>

		<template #actions>
			<SearchInput
				v-if="!loading && clients.length > 0"
				v-model="search"
				:placeholder="$t('search')"
				:show-filter="false"
				small
			/>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<VNotice v-if="!loading && clients.length === 0" class="empty-state">
			{{ $t('no_oauth_clients') }}
		</VNotice>

		<div v-else-if="!search || filteredRows.length > 0" class="content">
			<VTable
				v-model:headers="tableHeaders"
				show-resize
				fixed-header
				:items="filteredRows"
				:loading="loading"
				item-key="client_id"
				@click:row="({ item }) => router.push(`/settings/mcp-oauth-clients/${item.client_id}`)"
			>
				<template #[`item.client_name`]="{ item }">
					<VTextOverflow :text="item.client_name" :highlight="search" />
				</template>

				<template #[`item.client_id`]="{ item }">
					<VTextOverflow :text="item.client_id" :highlight="search" class="monospace" />
				</template>

				<template #item.actions="{ item }">
					<VMenu placement="bottom-end" show-arrow>
						<template #activator="{ toggle }">
							<VIcon name="more_vert" clickable @click.stop="toggle" />
						</template>
						<VList>
							<VListItem clickable @click="confirmRevoke = item.client_id">
								<VListItemIcon><VIcon name="delete" /></VListItemIcon>
								<VListItemContent>{{ $t('revoke_client') }}</VListItemContent>
							</VListItem>
						</VList>
					</VMenu>
				</template>
			</VTable>
		</div>

		<VInfo v-else icon="search" :title="$t('no_results')" center>
			{{ $t('no_results_copy') }}

			<template #append>
				<VButton @click="search = null">{{ $t('clear_filters') }}</VButton>
			</template>
		</VInfo>

		<VDialog :model-value="showRevokeDialog" @esc="confirmRevoke = null">
			<VCard>
				<VCardTitle>{{ $t('revoke_client') }}</VCardTitle>
				<VCardText>{{ $t('revoke_client_confirm') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="confirmRevoke = null">{{ $t('cancel') }}</VButton>
					<VButton kind="danger" :loading="revoking" @click="revokeClient">{{ $t('revoke_client') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.empty-state {
	margin: var(--content-padding);
}

.monospace {
	font-family: var(--theme--fonts--monospace--font-family);
}
</style>
