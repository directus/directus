<script setup lang="ts">
import api from '@/api';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';
import  ExtensionBanner  from './components/extension-banner.vue';

const props = defineProps<{
	extensionId: string;
}>();

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const error = ref<unknown>(null);
const extension = ref<RegistryDescribeResponse>();

watchEffect(async () => {
	if (!props.extensionId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/registry/${props.extensionId}`);
		extension.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});

const navigateBack = () => router.push('/settings/marketplace');
</script>

<template>
	<private-view :title="t('marketplace')">
		<template #title-outer:prepend>
			<v-button v-tooltip.bottom="t('back')" class="header-icon" rounded icon secondary exact @click="navigateBack">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="drawer-item-content">

			<template v-if="extension">
				<ExtensionBanner :extension="extension" />

				<div v-md="extension.readme" class="readme" />
			</template>

			<v-progress-circular v-else-if="loading" indeterminate />

			<v-error v-else :error="error" />
		</div>
	</private-view>
</template>

<style scoped lang="scss">
.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.readme {
	max-width: 600px;
}
</style>
