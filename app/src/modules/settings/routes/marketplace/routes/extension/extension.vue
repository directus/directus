<script setup lang="ts">
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { ref, watchEffect } from 'vue';
import SettingsNavigation from '../../../../components/navigation.vue';
import ExtensionBanner from './components/extension-banner.vue';
import ExtensionMetadata from './components/extension-metadata.vue';
import ExtensionReadme from './components/extension-readme.vue';
import api from '@/api';
import VBanner from '@/components/v-banner.vue';
import VError from '@/components/v-error.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	extensionId: string;
}>();

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
</script>

<template>
	<PrivateView :title="$t('marketplace')" show-back back-to="/settings/marketplace">
		<template #navigation>
			<SettingsNavigation />
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

			<VBanner v-else-if="loading" icon="plugin">
				<template #avatar><VProgressCircular indeterminate /></template>
				{{ $t('loading') }}
			</VBanner>

			<VError v-else :error="error" />
		</div>
	</PrivateView>
</template>

<style scoped lang="scss">
.extension-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
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
