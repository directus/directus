<script setup lang="ts">
import api from '@/api';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';

const props = defineProps<{
	authorId: string;
}>();

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const error = ref<unknown>(null);
const author = ref<RegistryDescribeResponse>();

watchEffect(async () => {
	if (!props.authorId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/registry/authors/${props.authorId}`);
		author.value = response.data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
});

const navigateBack = () => {
	const backState = router.options.history.state.back;

	if (typeof backState !== 'string' || !backState.startsWith('/login')) {
		router.back();
		return;
	}

	router.push('/settings/marketplace');
};
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

		<div class="author-content">
			<template v-if="author">
				<div class="container">
					<div class="grid"></div>
				</div>
			</template>

			<v-progress-circular v-else-if="loading" indeterminate />

			<v-error v-else :error="error" />
		</div>
	</private-view>
</template>

<style scoped lang="scss"></style>
