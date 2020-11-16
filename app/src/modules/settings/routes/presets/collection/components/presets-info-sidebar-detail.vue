<template>
	<sidebar-detail icon="info_outline" :title="$t('information')" close>
		<dl>
			<div>
				<dt>{{ $t('bookmarks') }}</dt>
				<dd>{{ bookmarksCount }}</dd>
			</div>
			<div>
				<dt>{{ $t('presets') }}</dt>
				<dd>{{ presetsCount }}</dd>
			</div>
		</dl>

		<v-divider />

		<div class="page-description" v-html="marked($t('page_help_settings_presets_collection'))" />
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import api from '@/api';
import marked from 'marked';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	setup() {
		const loading = ref(false);
		const bookmarksCount = ref<number | null>(null);
		const presetsCount = ref<number | null>(null);

		fetchCounts();

		return { bookmarksCount, presetsCount, marked };

		async function fetchCounts() {
			loading.value = true;

			try {
				const response = await api.get(`/presets`, {
					params: {
						[`filter[bookmark][_nnull]`]: true,
						fields: ['id'],
						meta: 'filter_count,total_count',
					},
				});

				bookmarksCount.value = response.data.meta.filter_count as number;
				presetsCount.value = (response.data.meta.total_count as number) - bookmarksCount.value;
			} catch (err) {
				unexpectedError(err);
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
