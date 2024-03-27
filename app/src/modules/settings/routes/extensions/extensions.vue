<script setup lang="ts">
import { useExtensionsStore } from '@/stores/extensions';
import { ExtensionType } from '@directus/extensions';
import { groupBy } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import ExtensionGroupDivider from './components/extension-group-divider.vue';
import ExtensionItem from './components/extension-item.vue';
import ExtensionsInfoSidebarDetail from './components/extensions-info-sidebar-detail.vue';

const { t } = useI18n();

const extensionsStore = useExtensionsStore();
const { extensions, loading } = storeToRefs(extensionsStore);

const bundled = computed(() => extensionsStore.extensions.filter(({ bundle }) => bundle !== null));

const regular = computed(() => extensionsStore.extensions.filter(({ bundle }) => bundle === null));

const extensionsByType = computed(() => {
	const groups = groupBy(regular.value, 'schema.type');

	if ('undefined' in groups) {
		groups['missing'] = groups['undefined'];
		delete groups['undefined'];
	}

	return groups;
});
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
					<extension-group-divider class="group-divider" :type="type as ExtensionType" />

					<v-list>
						<template v-for="ext in list" :key="ext.name">
							<extension-item
								:extension="ext"
								:children="ext.schema?.type === 'bundle' ? bundled.filter(({ bundle }) => bundle === ext.id) : []"
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
	padding: var(--content-padding);
	padding-top: 0;
	max-width: 1200px;
}

.group-divider {
	margin-bottom: 12px;
}

.extension-group + .extension-group {
	margin-top: 24px;
}
</style>
