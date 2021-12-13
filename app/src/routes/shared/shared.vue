<template>
	<public-view>
		<h2 class="type-title">{{ t('shared_with_you') }}</h2>

		<template v-if="shareInfo">
			<div v-if="remainingUses">
				<v-notice v-if="remainingUses === 1" type="danger">
					{{ t('shared_last_remaining') }}
				</v-notice>
				<v-notice v-else type="warning">
					{{ t('shared_times_remaining', { n: shareInfo.max_uses - shareInfo.times_used }) }}
				</v-notice>
			</div>
			<v-button>
				{{ t('access_shared_item') }}
			</v-button>
			<div>
				{{ shareInfo }}
			</div>
		</template>

		<v-notice v-if="error" type="danger">
			{{ errorFormatted }}
		</v-notice>
	</public-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { translateAPIError } from '@/lang';
import { defineComponent, computed, ref } from 'vue';
import api, { RequestError } from '@/api';

export default defineComponent({
	setup() {
		const { t } = useI18n();

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
		const remainingUses = computed(() => {
			if (shareInfo.value?.max_uses) {
				return shareInfo.value.max_uses - shareInfo.value.times_used;
			}
			return undefined;
		});

		getShareInformation(shareId);
		return { t, shareInfo, remainingUses, errorFormatted };

		async function getShareInformation(shareId: string) {
			try {
				const response = await api.get(`/shares/${shareId}`);
				shareInfo.value = response.data.data;
			} catch (err: any) {
				error.value = err;
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
