<template>
	<private-view :title="$t('insights')">
		<template #navigation>
			<insights-navigation />
		</template>

		<div class="not-found" v-if="!currentDashboard">
			<v-info :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</v-info>
		</div>
	</private-view>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import InsightsNavigation from '../components/navigation.vue';

export default defineComponent({
	components: { InsightsNavigation },
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
