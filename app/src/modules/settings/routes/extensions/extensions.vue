<script setup lang="ts">
import { useExtensionsStore } from '@/stores/extensions';
import { ApiOutput } from '@directus/types';
import { groupBy } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';
import ExtensionGroupDivider from './components/extension-group-divider.vue';
import ExtensionItem from './components/extension-item.vue';
import { ExtensionType } from './types';

type ExtensionsMap = Record<ExtensionType, ApiOutput[]>;

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

	return groups as ExtensionsMap;
});
</script>

<template>
	<private-view :title="$t('extensions')" icon="category">
		<template #headline><v-breadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div v-if="extensions.length > 0 || loading === false" class="page-container">
			<template v-if="extensions.length > 0">
				<div v-for="(list, type) in extensionsByType" :key="`${type}-list`" class="extension-group">
					<extension-group-divider class="group-divider" :type="type" />

					<v-list>
						<template v-for="extension in list" :key="extension.name">
							<extension-item
								:extension
								:children="
									extension.schema?.type === 'bundle' ? bundled.filter(({ bundle }) => bundle === extension.id) : []
								"
							/>
						</template>
					</v-list>
				</div>
			</template>

			<v-info v-else icon="error" center :title="$t('no_extensions')">
				{{ $t('no_extensions_copy') }}
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
	max-inline-size: 1200px;
}

.group-divider {
	margin-block-end: 12px;
}

.extension-group + .extension-group {
	margin-block-start: 24px;
}
</style>
