<script setup lang="ts">
import api from '@/api';
import VBanner from '@/components/v-banner.vue';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../../../components/navigation.vue';
import ExtensionBanner from './components/extension-banner.vue';
import ExtensionInfoSidebarDetail from './components/extension-info-sidebar-detail.vue';
import ExtensionMetadata from './components/extension-metadata.vue';
import ExtensionReadme from './components/extension-readme.vue';

const props = defineProps<{
	extensionId: string;
}>();

const router = useRouter();

const loading = ref(false);
const error = ref<unknown>(null);
const extension = ref<RegistryDescribeResponse['data']>();

watchEffect(async () => {
	if (!props.extensionId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/registry/extension/${props.extensionId}`);
		extension.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});

const navigateBack = () => {
	const backState = router.options.history.state.back;

	const isBackStateValid = backState && !(typeof backState === 'string' && backState.startsWith('/login'));

	if (isBackStateValid) {
		router.back();
		return;
	}

	router.push('/settings/marketplace');
};
</script>

<template>
	<private-view :title="$t('marketplace')">
		<template #title-outer:prepend>
			<v-button v-tooltip.bottom="$t('back')" class="header-icon" rounded icon secondary exact @click="navigateBack">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<template #sidebar>
			<extension-info-sidebar-detail />
		</template>

		<div class="extension-content">
			<template v-if="extension">
				<div class="container">
					<div class="grid">
						<ExtensionBanner class="banner" :extension="extension" />
						<ExtensionMetadata class="metadata" :extension="extension" />
						<ExtensionReadme class="readme" :readme="extension.readme" />
					</div>
				</div>
			</template>

			<v-banner v-else-if="loading" icon="plugin">
				<template #avatar><v-progress-circular indeterminate /></template>
				{{ $t('loading') }}
			</v-banner>

			<v-error v-else :error="error" />
		</div>
	</private-view>
</template>

<style scoped lang="scss">
.extension-content {
	padding: var(--content-padding);
	padding-block: 0 var(--content-padding-bottom);
	max-inline-size: 1200px;
	inline-size: 100%;
}

.container {
	container-type: inline-size;
	container-name: item;
}

.grid {
	display: grid;
	gap: 40px;
	grid-template-areas: 'banner' 'metadata' 'readme';
	grid-template-columns: minmax(0, 1fr);

	.banner {
		grid-area: banner;
	}

	.readme {
		grid-area: readme;
	}

	.metadata {
		grid-area: metadata;
	}

	@container item (width > 800px) {
		grid-template-columns: minmax(0, 1fr) 320px;
		grid-template-areas:
			'banner banner'
			'readme metadata';
	}
}
</style>
