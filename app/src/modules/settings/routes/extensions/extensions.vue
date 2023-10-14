<script setup lang="ts">
import api from '@/api';
import { ApiOutput, EXTENSION_TYPES } from '@directus/extensions';
import { groupBy } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import ExtensionGroupDivider from './components/extension-group-divider.vue';
import ExtensionItem from './components/extension-item.vue';
import ExtensionsInfoSidebarDetail from './components/extensions-info-sidebar-detail.vue';

const { t } = useI18n();

const error = ref();
const loading = ref(false);
const extensions = ref<ApiOutput[]>([]);

const bundled = computed(() => extensions.value.filter(({ bundle }) => !!bundle));
const regular = computed(() => extensions.value.filter(({ bundle }) => !!bundle === false));

const extensionsByType = computed(() => groupBy(regular.value, 'schema.type'));

const fetchExtensions = async () => {
	loading.value = true;

	try {
		const response = await api.get<{ data: ApiOutput[] }>('/extensions');

		// Only render extensions that are both installed _and_ configured
		extensions.value = response.data.data.filter((extension) => extension?.schema?.type !== undefined);
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
				<v-icon name="category" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<extensions-info-sidebar-detail />
		</template>

		<div v-if="extensions.length > 0 || loading === false" class="page-container">
			<template v-if="extensions.length > 0">
				<div v-for="(list, type) in extensionsByType" :key="`${type}-list`" class="extension-group">
					<extension-group-divider class="group-divider" :type="(type as typeof EXTENSION_TYPES[number])" />

					<v-list>
						<template v-for="extension in list" :key="extension.name">
							<extension-item
								:extension="extension"
								:children="
									extension.schema?.type === 'bundle' ? bundled.filter(({ bundle }) => bundle === extension.name) : []
								"
								@refresh="fetchExtensions"
							/>
						</template>
					</v-list>
				</div>
			</template>

			<v-info v-else icon="error" center :title="t('no_extensions')">
				{{ t('no_extensions_copy') }}
			</v-info>
		</div>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}

.page-container {
	padding-top: 0;
	padding: var(--content-padding);
}

.group-divider {
	margin-bottom: 12px;
}

.extension-group + .extension-group {
	margin-top: 24px;
}
</style>
