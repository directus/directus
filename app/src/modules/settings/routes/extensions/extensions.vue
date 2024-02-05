<script setup lang="ts">
import VNotice from '@/components/v-notice.vue';
import { useReloadGuard } from '@/composables/use-reload-guard';
import { useExtensionsStore } from '@/stores/extensions';
import { APP_OR_HYBRID_EXTENSION_TYPES, ApiOutput, ExtensionType } from '@directus/extensions';
import { groupBy } from 'lodash';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import ExtensionGroupDivider from './components/extension-group-divider.vue';
import ExtensionItem from './components/extension-item.vue';
import ExtensionsInfoSidebarDetail from './components/extensions-info-sidebar-detail.vue';

const { t } = useI18n();

const extensionsStore = useExtensionsStore();
const { extensions, loading } = storeToRefs(extensionsStore);

const needsReload = ref(false);

const bundled = computed(() => extensionsStore.extensions.filter(({ bundle }) => bundle !== null));
const regular = computed(() => extensionsStore.extensions.filter(({ bundle }) => bundle === null));
const extensionsByType = computed(() => groupBy(regular.value, 'schema.type'));

const { confirmLeave, leaveTo } = useReloadGuard(needsReload);

const currentPageLink = () => document.location.href;

const leavePage = () => {
	needsReload.value = false;
	// navigate to new page using a full page reload
	document.location.href = leaveTo.value ?? currentPageLink();
};

const isBrowserExtension = (type: string) => {
	return (APP_OR_HYBRID_EXTENSION_TYPES as readonly string[]).includes(type);
};

const refreshExtensions = async ({
	enabled,
	extension,
	children,
}: {
	enabled: boolean;
	extension: ApiOutput;
	children: ApiOutput[];
}) => {
	await extensionsStore.refresh();

	if (!extension.schema?.type) {
		return;
	}

	if (isBrowserExtension(extension.schema.type)) {
		needsReload.value = true;
	}

	if (extension.schema.type !== 'bundle') {
		return;
	}

	if (extension.schema.partial === false) {
		// A non partial bundles entries can only be toggled all at once.
		// Only type needs to be checked as status will be in sync
		if (children.some((e) => e.schema?.type && isBrowserExtension(e.schema?.type))) {
			needsReload.value = true;
		}

		return;
	}

	if (children.some((e) => e.meta.enabled !== enabled && e.schema?.type && isBrowserExtension(e.schema.type))) {
		// A partial bundle can have entries already be in the desired state so we need to check the status and type
		needsReload.value = true;
		return;
	}
};
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

		<div v-if="needsReload" class="page-container">
			<v-notice type="warning">
				{{ t('extension_reload_required_copy') }}&nbsp;
				<a :href="currentPageLink()">{{ t('extension_reload_now') }}</a>
			</v-notice>
		</div>

		<div v-if="extensions.length > 0 || loading === false" class="page-container">
			<template v-if="extensions.length > 0">
				<div v-for="(list, type) in extensionsByType" :key="`${type}-list`" class="extension-group">
					<extension-group-divider class="group-divider" :type="(type as ExtensionType)" />

					<v-list>
						<template v-for="ext in list" :key="ext.name">
							<extension-item
								:extension="ext"
								:children="ext.schema?.type === 'bundle' ? bundled.filter(({ bundle }) => bundle === ext.id) : []"
								@refresh="refreshExtensions"
							/>
						</template>
					</v-list>
				</div>
			</template>

			<v-info v-else icon="error" center :title="t('no_extensions')">
				{{ t('no_extensions_copy') }}
			</v-info>
		</div>

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('extension_reload_required') }}</v-card-title>
				<v-card-text>{{ t('extension_reload_required_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="confirmLeave = false">{{ t('back') }}</v-button>
					<v-button @click="leavePage">{{ t('extension_reload_now') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
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
}

.group-divider {
	margin-bottom: 12px;
}

.extension-group + .extension-group {
	margin-top: 24px;
}
</style>
