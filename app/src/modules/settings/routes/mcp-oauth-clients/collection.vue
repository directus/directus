<script setup lang="ts">
import { useLayout } from '@directus/composables';
import { ref } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import VInfo from '@/components/v-info.vue';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import SearchInput from '@/views/private/components/search-input.vue';

const layout = ref('tabular');
const layoutRef = ref();
const selection = ref<string[]>([]);
const filter = ref(null);
const search = ref<string | null>(null);
const layoutOptions = ref({});
const layoutQuery = ref({});

const { layoutWrapper } = useLayout(layout);

const { confirmDelete, deleting, batchDelete, error: deleteError } = useBatch();

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}

function useBatch() {
	const confirmDelete = ref(false);
	const deleting = ref(false);
	const error = ref<any>(null);

	return { confirmDelete, deleting, batchDelete, error };

	async function batchDelete() {
		if (deleting.value) return;

		deleting.value = true;

		try {
			await api.delete('/mcp-oauth/clients', {
				data: selection.value,
			});

			selection.value = [];
			await refresh();
			confirmDelete.value = false;
		} catch (err: any) {
			error.value = err;
		} finally {
			deleting.value = false;
		}
	}
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
		:filter-user="filter"
		:filter="filter"
		:search="search"
		collection="directus_oauth_clients"
		:clear-filters="clearFilters"
	>
		<PrivateView :title="$t('mcp_oauth_clients')" icon="key" show-back back-to="/settings/ai">
			<template #headline>
				<VBreadcrumb
					:items="[
						{ name: $t('settings'), to: '/settings' },
						{ name: $t('settings_ai'), to: '/settings/ai' },
					]"
				/>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-tabular`" v-bind="layoutState" />
			</template>

			<template #actions>
				<SearchInput v-model="search" v-model:filter="filter" collection="directus_oauth_clients" small />

				<VDialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							v-tooltip.bottom="$t('revoke_client')"
							class="action-delete"
							secondary
							icon="delete"
							@click="on"
						/>
					</template>

					<VCard>
						<VCardTitle>{{ $t('revoke_client') }}</VCardTitle>
						<VCardText>{{ $t('revoke_client_confirm') }}</VCardText>

						<VCardActions>
							<VButton secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</VButton>
							<VButton kind="danger" :loading="deleting" @click="batchDelete">
								{{ $t('revoke_client') }}
							</VButton>
						</VCardActions>
					</VCard>
				</VDialog>
			</template>

			<template #navigation>
				<SettingsNavigation />
			</template>

			<component :is="`layout-tabular`" v-bind="layoutState">
				<template #no-results>
					<VInfo :title="$t('no_results')" icon="search" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<VButton @click="clearFilters">{{ $t('clear_filters') }}</VButton>
						</template>
					</VInfo>
				</template>

				<template #no-items>
					<VInfo :title="$t('no_oauth_clients')" icon="key" center />
				</template>
			</component>

			<VDialog :model-value="deleteError !== null">
				<VCard>
					<VCardTitle>{{ $t('something_went_wrong') }}</VCardTitle>
					<VCardText>
						<VError :error="deleteError" />
					</VCardText>
					<VCardActions>
						<VButton @click="deleteError = null">{{ $t('done') }}</VButton>
					</VCardActions>
				</VCard>
			</VDialog>
		</PrivateView>
	</component>
</template>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}
</style>
