<script setup lang="ts">
import ContentNavigation from '../components/navigation.vue';
</script>

<template>
	<private-view :title="$t('page_not_found')">
		<template #navigation>
			<content-navigation />
		</template>

		<div class="not-found">
			<v-info :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</v-info>
		</div>
	</private-view>
</template>

<style lang="scss" scoped>
.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
