<template>
	<drawer-detail icon="info_outline" :title="$t('information')" close>
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
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import api from '@/api';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();

		const loading = ref(false);
		const error = ref<any>(null);
		const bookmarksCount = ref<number | null>(null);
		const presetsCount = ref<number | null>(null);

		fetchCounts();

		return { bookmarksCount, presetsCount };

		async function fetchCounts() {
			const { currentProjectKey } = projectsStore.state;

			loading.value = true;

			try {
				const response = await api.get(`/${currentProjectKey}/collection_presets`, {
					params: {
						[`filter[title][nnull]`]: 1,
						fields: ['id'],
						meta: 'filter_count,total_count',
					},
				});

				bookmarksCount.value = response.data.meta.filter_count as number;
				presetsCount.value = (response.data.meta.total_count as number) - bookmarksCount.value;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>
