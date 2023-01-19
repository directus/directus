<template>
	<private-view :title="title">
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

		<template #actions>
			<v-button rounded icon>
				<v-icon name="save_alt" @click="installDialog = true" />
			</v-button>
		</template>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_settings_flows_collection')" class="page-description" />
			</sidebar-detail>
		</template>

		<Suspense>
			<Extension :name="name" app/>
			<template #fallback>
				Loading...
			</template>
		</Suspense>

		<v-dialog :modelValue="installDialog">
			<v-card>
				<v-card-title>Install {{ title }}</v-card-title>
				<v-card-text>
					Are you sure that you want to install this extension?
					The extension has full access to your database and can do anything.
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="installDialog = false">Close</v-button>
					<v-button danger @click="install()">Install</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import Extension from '@nitwel/directus-marketplace/components/extension.vue';
import { formatTitle } from '@nitwel/directus-marketplace/utils/format';
import { computed, provide, ref } from 'vue';
import { useRouter } from 'vue-router';
import { marketApi } from './market-api';
import api from '@/api';

interface Props {
	name: string;
}

const props = defineProps<Props>();
const installDialog = ref(false);

const {} = useRouter();

provide('api', marketApi);

const { t } = useI18n();

async function install() {
	await api.post(`/extensions/${encodeURIComponent(props.name)}`)
	location.reload();
	installDialog.value = false;
}

const title = computed(() => {
	return formatTitle(props.name);
});

</script>

<style scoped>
.header-icon {
	--v-button-color: var(--primary);
	--v-button-background-color: var(--primary-10);
}
.extension {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
