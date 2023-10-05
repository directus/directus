<script setup lang="ts">
import ExtensionsInfoSidebarDetail from './components/extensions-info-sidebar-detail.vue';
import SettingsNavigation from '../../components/navigation.vue';
import ExtensionItem from './components/extension-item.vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { ref, unref, computed } from 'vue';
import type { ExtensionInfo } from '@directus/extensions';
import { groupBy } from 'lodash';

const { t } = useI18n();

const error = ref();
const loading = ref(false);
const extensions = ref<ExtensionInfo[]>([]);

const extensionsGrouped = computed(() => groupBy(unref(extensions), 'type'));

const fetchExtensions = async () => {
	loading.value = true;

	try {
		const response = await api.get('/extensions');
		extensions.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
};

fetchExtensions();
</script>

<template>
	<private-view :title="t('extensions')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="extension" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<extensions-info-sidebar-detail />
		</template>

		<div class="page-container">
			{{ extensionsGrouped }}

			<v-list v-if="extensions.length > 0 && !loading">
				<extension-item
					v-for="extension in extensions"
					:key="extension.type + '-' + extension.name"
					:name="extension.name"
					:type="extension.type"
				/>
			</v-list>

			<v-info
				v-else
				icon="error"
				center
				:title="t('no_extensions')"
			>
				{{ t('no_extensions_copy') }}
			</v-info>
		</div>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--primary-10);
	--v-button-color-disabled: var(--primary);
	--v-button-background-color-hover-disabled: var(--primary-25);
	--v-button-color-hover-disabled: var(--primary);
}

.page-container {
	padding-top: 0;
	padding: var(--content-padding);
}
</style>
