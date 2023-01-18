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

		<template #actions>
			<v-button
				rounded
				icon
			>
				<v-icon name="add" />
			</v-button>
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
import axios from 'axios';
import { getRootPath } from '@/utils/get-root-path';

interface Props {
	name: string;
}

const props = defineProps<Props>();

const {} = useRouter();

const api = axios.create({
	baseURL: getRootPath() + 'market/',
	headers: {
		'Cache-Control': 'no-store',
	},
});

provide('api', api);

const { t } = useI18n();

</script>

<style scoped>
.header-icon {
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-disabled: var(--primary-10);
}
.user {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
