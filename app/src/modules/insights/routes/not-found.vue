<script setup lang="ts">
import VInfo from '@/components/v-info.vue';
import { PrivateView } from '@/views/private';
import InsightsNavigation from '../components/navigation.vue';
</script>

<template>
	<PrivateView :title="$t('insights')">
		<template #navigation>
			<InsightsNavigation />
		</template>

		<div class="not-found">
			<VInfo :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</VInfo>
		</div>
	</PrivateView>
</template>

<style scoped>
.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
