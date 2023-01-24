<template>
	<private-view :title="t('marketplace')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon>
				<v-icon name="bolt" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_marketplace')" class="page-description" />
			</sidebar-detail>
		</template>

		<Overview :type="type" app :existingExtensions="extensionsStore.extensions"/>
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import Overview from '@nitwel/directus-marketplace/components/overview.vue';
import { computed, provide } from 'vue';
import { marketApi } from './market-api';
import { useExtensionsStore } from '@/stores/extensions';

interface Props {
	type?: string;
}

const props = defineProps<Props>();

const extensionsStore = useExtensionsStore();


provide('api', marketApi);

const { t } = useI18n();

</script>

<style scoped>
.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
}
.overview {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
