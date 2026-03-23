<script setup lang="ts">
import ContentNavigation from '../components/navigation.vue';
import VInfo from '@/components/v-info.vue';
import { PrivateView } from '@/views/private';
</script>

<template>
	<PrivateView :title="$t('page_not_found')">
		<template #navigation>
			<ContentNavigation />
		</template>

		<div class="not-found">
			<VInfo :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</VInfo>
		</div>
	</PrivateView>
</template>

<style lang="scss" scoped>
.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
