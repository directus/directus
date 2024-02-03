<script setup lang="ts">
import api from '@/api';
import type { RegistryDescribeResponse } from '@directus/extensions-registry';
import { ref, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../../components/navigation.vue';

const props = defineProps<{
	accountId: string;
}>();

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const error = ref<unknown>(null);
const account = ref<RegistryDescribeResponse>();

watchEffect(async () => {
	if (!props.accountId) return;

	loading.value = true;

	try {
		const response = await api.get(`/extensions/registry/account/${props.accountId}`);
		account.value = response.data.data;
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

		<div class="account-content">
			<template v-if="account">
				<div class="container">
					<div class="grid"></div>
				</div>
			</template>

			<v-progress-circular v-else-if="loading" indeterminate />

			<v-error v-else :error="error" />
		</div>
	</private-view>
</template>

<style scoped lang="scss">
.account-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
	max-width: 1200px;
	width: 100%;
}

.container {
	container-type: inline-size;
	container-name: item;
}

.grid {
	display: grid;
	gap: 40px;
	grid-template-areas: 'banner' 'metadata' 'readme';

	.banner {
		grid-area: banner;
	}

	.readme {
		grid-area: readme;
		min-width: 0;
	}

	.metadata {
		grid-area: metadata;
	}

	@container item (width > 800px) {
		grid-template-columns: 1fr 320px;
		grid-template-areas:
			'banner banner'
			'readme metadata';
	}
}
</style>

