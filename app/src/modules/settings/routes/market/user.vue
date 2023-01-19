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
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<Suspense>
			<User :name="name" app/>
			<template #fallback>
				Loading...
			</template>
		</Suspense>
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import User from '@nitwel/directus-marketplace/components/user.vue';
import { provide } from 'vue';
import { useRouter } from 'vue-router';
import { marketApi } from './market-api';

interface Props {
	name: string;
}

const props = defineProps<Props>();

const {} = useRouter();

provide('api', marketApi);

const { t } = useI18n();

</script>

<style scoped>
.header-icon {
	--v-button-color: var(--primary);
	--v-button-background-color: var(--primary-10);
}
.user {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
