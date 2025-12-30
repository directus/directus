<script setup lang="ts">
import ExtensionGroupDivider from './components/extension-group-divider.vue';
import ExtensionItem from './components/ExtensionItem.vue';
import { ExtensionType } from './types';
import SettingsNavigation from '../../components/navigation.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VInfo from '@/components/v-info.vue';
import VList from '@/components/v-list.vue';
import { useExtensionsStore } from '@/stores/extensions';
import { PrivateView } from '@/views/private';
import { ApiOutput } from '@directus/types';
import { groupBy } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

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
	<PrivateView :title="$t('extensions')" icon="category">
		<template #headline><VBreadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div v-if="extensions.length > 0 || loading === false" class="page-container">
			<template v-if="extensions.length > 0">
				<div v-for="(list, type) in extensionsByType" :key="`${type}-list`" class="extension-group">
					<ExtensionGroupDivider class="group-divider" :type="type" />

					<VList>
						<template v-for="extension in list" :key="extension.name">
							<ExtensionItem
								:extension
								:children="
									extension.schema?.type === 'bundle' ? bundled.filter(({ bundle }) => bundle === extension.id) : []
								"
							/>
						</template>
					</VList>
				</div>
			</template>

			<VInfo v-else icon="error" center :title="$t('no_extensions')">
				{{ $t('no_extensions_copy') }}
			</VInfo>
		</div>
	</PrivateView>
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
