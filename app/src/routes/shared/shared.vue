<template>
	<shared-view inline :title="notFound ? t('share_access_not_found_title') : t('share_access_page')">
		<v-progress-circular v-if="loading" indeterminate />

		<div v-else-if="notFound">
			<strong>{{ t('share_access_not_found') }}</strong>
			{{ t('share_access_not_found_desc') }}
		</div>

		<v-error v-else-if="error" :error="error" />

		<template v-else-if="shareInfo">
			<pre>{{ shareInfo }}</pre>

			<v-input v-if="shareInfo.password" @update:modelValue="passwordInput = $event" />

			<v-button @click="login">
				{{ t('access_shared_item') }}
			</v-button>
		</template>
	</shared-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { translateAPIError } from '@/lang';
import { defineComponent, computed, ref, watch } from 'vue';
import api, { RequestError } from '@/api';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const loading = ref(false);

		const notFound = ref(false);

		const error = ref<RequestError | null>(null);
		const errorFormatted = computed(() => {
			if (error.value) {
				return translateAPIError(error.value);
			}

			return null;
		});

		const route = useRoute();

		const shareId = route.params.id as string;

		const shareInfo = ref<any>();

		const passwordInput = ref<string>();

		getShareInformation(shareId);

		return { t, shareInfo, error, errorFormatted, loading, notFound, passwordInput, login };

		async function getShareInformation(shareId: string) {
			loading.value = true;

			try {
				const response = await api.get(`/shares/info/${shareId}`);
				shareInfo.value = response.data.data;
			} catch (err: any) {
				if (err.response?.status === 404 || err.response?.status === 403) {
					notFound.value = true;
				} else {
					error.value = err;
				}
			} finally {
				loading.value = false;
			}
		}

		async function login() {
			loading.value = true;

			try {
				await api.post('/shares/auth', {
					id: shareId,
					mode: 'cookie',
					password: passwordInput.value,
				});
			} catch (err: any) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
h2 {
	margin-bottom: 20px;
}

.v-input,
.v-notice {
	margin-bottom: 20px;
}
</style>
