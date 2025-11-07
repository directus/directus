<script setup lang="ts">
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const loading = ref(false);
const bookmarksCount = ref<number | null>(null);
const presetsCount = ref<number | null>(null);

fetchCounts();

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
	} catch (error) {
		unexpectedError(error);
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<sidebar-detail id="presets" icon="info" :title="t('information')">
		<dl>
			<div>
				<dt>{{ t('bookmarks') }}</dt>
				<dd>{{ bookmarksCount }}</dd>
			</div>
			<div>
				<dt>{{ t('presets') }}</dt>
				<dd>{{ presetsCount }}</dd>
			</div>
		</dl>

		<v-divider />

		<div v-md="t('page_help_settings_presets_collection')" class="page-description" />
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 20px 0;
}
</style>
