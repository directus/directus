<template>
	<private-view :title="$t('page_not_found')">
		<template #navigation>
			<collections-navigation />
		</template>

		<div class="not-found">
			<v-info :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</v-info>
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import CollectionsNavigation from '../components/navigation.vue';

export default defineComponent({
	components: { CollectionsNavigation },
});
</script>

<style lang="scss" scoped>
.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
