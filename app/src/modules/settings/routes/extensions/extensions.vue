<script setup lang="ts">
import api from '@/api';
import { APP_OR_HYBRID_EXTENSION_TYPES, ApiOutput, ExtensionType } from '@directus/extensions';
import { groupBy } from 'lodash';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { currentPageLink } from './utils/current-page-link';
import { useReloadGuard } from './utils/use-reload-guard';
import SettingsNavigation from '../../components/navigation.vue';
import ExtensionGroupDivider from './components/extension-group-divider.vue';
import ExtensionItem from './components/extension-item.vue';
import ExtensionsInfoSidebarDetail from './components/extensions-info-sidebar-detail.vue';
import VNotice from '@/components/v-notice.vue';

const { t } = useI18n();
const router = useRouter();

const error = ref();
const loading = ref(false);
const extensions = ref<ApiOutput[]>([]);
const needsReload = ref<boolean>(false);

const bundled = computed(() => extensions.value.filter(({ bundle }) => !!bundle));
const regular = computed(() => extensions.value.filter(({ bundle }) => !bundle));
const extensionsByType = computed(() => groupBy(regular.value, 'schema.type'));

const { confirmLeave, leaveTo, removeGuard } = useReloadGuard(needsReload);

const leavePage = () => {
	removeGuard();
	const target = leaveTo.value ?? currentPageLink();
	router.push(target);
	// reload the page
	router.go(0);
};

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

const isBrowserExtension = (type: string) => {
	return (APP_OR_HYBRID_EXTENSION_TYPES as readonly string[]).includes(type);
};

const refreshExtensions = async (extensionType?: ExtensionType) => {
	if (extensionType && isBrowserExtension(extensionType)) {
		needsReload.value = true;
	}

	await fetchExtensions();
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

		<div v-if="needsReload" class="page-container">
			<v-notice type="warning">
				{{ t('extension_reload_required_copy') }}&nbsp;
				<a :href="currentPageLink()" @click="removeGuard">{{ t('extension_reload_now') }}</a>
			</v-notice>
		</div>

		<div v-if="extensions.length > 0 || loading === false" class="page-container">
			<template v-if="extensions.length > 0">
				<div v-for="(list, type) in extensionsByType" :key="`${type}-list`" class="extension-group">
					<extension-group-divider class="group-divider" :type="type as ExtensionType" />

					<v-list>
						<template v-for="extension in list" :key="extension.name">
							<extension-item
								:extension="extension"
								:children="
									extension.schema?.type === 'bundle' ? bundled.filter(({ bundle }) => bundle === extension.name) : []
								"
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
					<v-button @click="leavePage">{{ t('extension_reload_now') }}</v-button>
					<v-button secondary @click="confirmLeave = false">{{ t('back') }}</v-button>
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
