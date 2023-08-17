<template>
	<private-view :title="name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact to="/settings/market">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: t('marketplace'), to: '/settings/market' }]" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<sidebar-detail icon="info" :title="t('information')" close>
				<div v-md="t('page_help_settings_marketplace')" class="page-description" />
			</sidebar-detail>
		</template>

		<User :name="name" app :existing-extensions="extensionsStore.extensions" />
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import User from '@nitwel/directus-marketplace/market/user.vue';
import { provide } from 'vue';
import { marketApi } from './market-api';
import { useExtensionsStore } from '@/stores/extensions';

interface Props {
	name: string;
}

defineProps<Props>();

const extensionsStore = useExtensionsStore();

provide('api', marketApi);

const { t } = useI18n();
</script>

<style scoped lang="scss">
.header-icon {
	--v-button-color: var(--primary);
	--v-button-background-color: var(--primary-10);
}
.user {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
