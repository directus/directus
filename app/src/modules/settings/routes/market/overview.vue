<template>
	<private-view :title="t('marketplace')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon>
				<v-icon name="storefront" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" />
		</template>

		<template #actions>
			<search-input v-model="search" :show-filter="false" always-active />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_marketplace')" class="page-description" />
			</sidebar-detail>
		</template>

		<Types v-model:type="type" app />
		<Overview :type="type" app :existing-extensions="extensionsStore.extensions" :search="search" />
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import Overview from '@nitwel/directus-marketplace/market/overview.vue';
import Types from '@nitwel/directus-marketplace/market/types.vue';
import { provide, ref } from 'vue';
import { marketApi } from './market-api';
import { useExtensionsStore } from '@/stores/extensions';
import SearchInput from '@/views/private/components/search-input.vue';

const type = ref('all');
const extensionsStore = useExtensionsStore();

provide('api', marketApi);

const { t } = useI18n();

const search = ref<string | null>('');
</script>

<style scoped lang="scss">
.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
}

.extension-types {
	padding: 0 var(--content-padding) 0 var(--content-padding);
}

.overview {
	margin: var(--content-padding);
	margin-top: 0;
}
</style>
