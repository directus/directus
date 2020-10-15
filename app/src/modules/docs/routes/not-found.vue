<template>
	<private-view :title="$t('page_not_found')">
		<template #navigation>
			<docs-navigation :path="path" />
		</template>

		<div class="not-found">
			<v-info :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</v-info>
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import DocsNavigation from '../components/navigation.vue';

export default defineComponent({
	name: 'NotFound',
	components: { DocsNavigation },
	async beforeRouteEnter(to, from, next) {
		next((vm: any) => {
			vm.path = to.path;
		});
	},
	async beforeRouteUpdate(to, from, next) {
		this.path = to.path;
		next();
	},
	setup() {
		const path = ref<string | null>(null);
		return { path };
	},
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
