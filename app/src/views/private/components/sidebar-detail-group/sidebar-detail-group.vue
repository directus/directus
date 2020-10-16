<template>
	<v-item-group class="sidebar-detail-group" v-model="openDetail" scope="sidebar-detail">
		<slot />
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';

export default defineComponent({
	props: {
		sidebarOpen: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		// By syncing the opened item here, we can force close the module once the sidebar closes
		const openDetail = ref<string[]>([]);

		watch(
			() => props.sidebarOpen,
			(newOpenState) => {
				if (newOpenState === false) {
					openDetail.value = [];
				}
			}
		);

		return {
			openDetail,
		};
	},
});
</script>

<style lang="scss" scoped>
.sidebar-detail-group {
	display: contents;
}
</style>
