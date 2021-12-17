<template>
	<shared-view :inline="!authenticated" :title="notFound ? t('share_access_not_found_title') : t('share_access_page')">
		<v-progress-circular v-if="loading" indeterminate />

		<div v-else-if="notFound">
			<strong>{{ t('share_access_not_found') }}</strong>
			{{ t('share_access_not_found_desc') }}
		</div>

		<v-error v-else-if="error" :error="error" />

		<template v-else-if="shareInfo">
			<pre>{{ shareInfo }}</pre>

			<v-input v-if="shareInfo.password" @update:modelValue="passwordInput = $event" />

			<v-button @click="actuallyLogin">
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
import { useAppStore } from '@/stores';
import api, { RequestError } from '@/api';
import { login } from '@/auth';

type ShareInfo = {
	collection: string;
	item: string;
	password?: string;
	date_start?: Date;
	date_end?: Date;
	max_uses?: number;
	times_used: number;
};

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const appStore = useAppStore();
		const authenticated = computed(() => appStore.authenticated);

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

		const shareInfo = ref<ShareInfo>();

		const passwordInput = ref<string>();

		getShareInformation(shareId);

		return {
			t,
			shareInfo,
			error,
			errorFormatted,
			loading,
			notFound,
			passwordInput,
			actuallyLogin,
			authenticated,
		};

		async function getShareInformation(shareId: string) {
			loading.value = true;

			try {
				const response = await api.get(`/shares/info/${shareId}`);
				shareInfo.value = response.data.data;
				const { password, max_uses } = shareInfo.value!;
				if (!password && !max_uses) {
					actuallyLogin();
				}
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

		async function actuallyLogin() {
			loading.value = true;

			try {
				const credentials = { share_id: shareId, password: passwordInput.value };
				await login({ shared: true, credentials });
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
