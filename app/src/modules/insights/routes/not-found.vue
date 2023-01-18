<template>
	<private-view :title="t('insights')">
		<template #navigation>
			<insights-navigation />
		</template>

		<div v-if="!currentDashboard" class="not-found">
			<v-info :title="t('page_not_found')" icon="not_interested">
				{{ t('page_not_found_body') }}
			</v-info>
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import InsightsNavigation from '../components/navigation.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	components: { InsightsNavigation },
	setup() {
		const { t } = useI18n();

		return { t };
	},
});
</script>

<style scoped>
.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
