<template>
	<div v-if="loading || authenticating" class="hydrating">
		<v-progress-circular indeterminate />
	</div>

	<shared-view
		v-else
		:inline="!authenticated"
		:title="notFound ? t('share_access_not_found_title') : t('share_access_page')"
	>
		<v-progress-circular v-if="loading" indeterminate />

		<div v-else-if="notFound">
			<strong>{{ t('share_access_not_found') }}</strong>
			{{ t('share_access_not_found_desc') }}
		</div>

		<v-error v-else-if="error" :error="error" />

		<template v-else-if="share">
			<template v-if="!authenticated">
				<v-notice v-if="usesLeft !== undefined" :type="usesLeft === 0 ? 'danger' : 'warning'">
					{{ t('usesleft', usesLeft) }}
				</v-notice>

				<template v-if="usesLeft !== 0">
					<v-input v-if="share.password" @update:modelValue="passwordInput = $event" />
					<v-button @click="authenticate">
						{{ t('access_shared_item') }}
					</v-button>
				</template>
			</template>

			<template v-else>
				<share-item :collection="share.collection" :primary-key="share.item" />
			</template>
		</template>
	</shared-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { defineComponent, computed, ref } from 'vue';
import { useAppStore } from '@/stores';
import api, { RequestError } from '@/api';
import { login } from '@/auth';
import { Share } from '@directus/shared/types';
import ShareItem from './components/share-item.vue';

type ShareInfo = Pick<
	Share,
	'id' | 'collection' | 'item' | 'password' | 'date_start' | 'date_end' | 'max_uses' | 'times_used'
>;

export default defineComponent({
	components: { ShareItem },
	setup() {
		const { t } = useI18n();

		const appStore = useAppStore();
		const authenticated = computed(() => appStore.authenticated);

		const shareInfoLoading = ref(true);
		const authenticating = ref(false);

		const notFound = ref(false);

		const error = ref<RequestError | null>(null);

		const route = useRoute();

		const shareId = route.params.id as string;
		const share = ref<ShareInfo>();

		const usesLeft = ref<number | null>(null);

		const passwordInput = ref<string>();

		getShareInformation(shareId);

		return {
			t,
			share,
			error,
			shareInfoLoading,
			notFound,
			passwordInput,
			authenticate,
			authenticated,
			authenticating,
			usesLeft,
		};

		async function getShareInformation(shareId: string) {
			shareInfoLoading.value = true;

			try {
				const response = await api.get(`/shares/info/${shareId}`);
				share.value = response.data.data;

				if (!share.value) {
					notFound.value = true;
					shareInfoLoading.value = false;
					return;
				}

				const { password, max_uses, times_used } = share.value;

				if (max_uses) {
					usesLeft.value = max_uses - times_used;
				}

				if (!password && !max_uses) {
					authenticate();
				}
			} catch (err: any) {
				if (err.response?.status === 404 || err.response?.status === 403) {
					notFound.value = true;
				} else {
					error.value = err;
				}
			} finally {
				shareInfoLoading.value = false;
			}
		}

		async function authenticate() {
			authenticating.value = true;

			try {
				const credentials = { share_id: shareId, password: passwordInput.value };
				await login({ share: true, credentials });
			} catch (err: any) {
				error.value = err;
			} finally {
				authenticating.value = false;
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

.hydrating {
	position: fixed;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}
</style>
