<script setup lang="ts">
import type { RegistryAccountResponse, RegistryListResponse } from '@directus/extensions-registry';
import { computed, ref, watchEffect } from 'vue';
import SettingsNavigation from '../../../../components/navigation.vue';
import ExtensionListItem from '../../components/extension-list-item.vue';
import AccountBanner from './components/account-banner.vue';
import AccountMetadata from './components/account-metadata.vue';
import api from '@/api';
import VBanner from '@/components/v-banner.vue';
import VError from '@/components/v-error.vue';
import VList from '@/components/v-list.vue';
import VPagination from '@/components/v-pagination.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	accountId: string;
}>();

const loading = ref(false);
const error = ref<unknown>(null);
const account = ref<RegistryAccountResponse['data']>();

watchEffect(async () => {
	if (!props.accountId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/registry/account/${props.accountId}`);
		account.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});

const perPage = 6;
const page = ref(1);
const extensions = ref<RegistryListResponse['data']>([]);
const filterCount = ref(0);
const pageCount = computed(() => Math.round(filterCount.value / perPage));

watchEffect(async () => {
	const { data } = await api.get('/extensions/registry', {
		params: {
			limit: perPage,
			offset: (page.value - 1) * perPage,
			filter: { by: { _eq: props.accountId } },
		},
	});

	filterCount.value = data.meta.filter_count;
	extensions.value = data.data;
});
</script>

<template>
	<PrivateView :title="$t('marketplace')" show-back back-to="/settings/marketplace">
		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="account-content">
			<template v-if="account">
				<div class="container">
					<div class="grid">
						<AccountBanner class="banner" :account="account" />
						<AccountMetadata class="metadata" :account="account" />
						<VList>
							<ExtensionListItem v-for="extension in extensions" :key="extension.id" :extension="extension" />
						</VList>

						<VPagination
							v-if="pageCount > 1"
							v-model="page"
							class="pagination"
							:length="pageCount"
							:total-visible="5"
						/>
					</div>
				</div>
			</template>

			<VBanner v-else-if="loading" icon="plugin">
				<template #avatar><VProgressCircular indeterminate /></template>
				{{ $t('loading') }}
			</VBanner>

			<VError v-else :error="error" />
		</div>
	</PrivateView>
</template>

<style scoped lang="scss">
.account-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
	max-inline-size: 1200px;
	inline-size: 100%;
}

.container {
	container-type: inline-size;
	container-name: item;
}

.grid {
	display: grid;
	gap: 40px;
	grid-template-areas: 'banner' 'metadata' 'readme';

	.banner {
		grid-area: banner;
	}

	.readme {
		grid-area: readme;
		min-inline-size: 0;
	}

	.metadata {
		grid-area: metadata;
	}

	@container item (width > 800px) {
		grid-template-columns: 1fr 320px;
		grid-template-areas:
			'banner banner'
			'readme metadata';
	}
}
</style>
