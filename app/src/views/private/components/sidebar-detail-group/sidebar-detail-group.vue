<template>
	<v-item-group v-model="openDetail" class="sidebar-detail-group" scope="sidebar-detail" :mandatory="mandatory">
		<slot />
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, watch } from 'vue';
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

		const mandatory = ref(false);

		watch(
			() => props.sidebarOpen,
			async (newOpenState) => {
				if (newOpenState === false) {
					openDetail.value = [];
				} else {
					// Ensures the first item in the sidebar is automatically opened whenever the sidebar opens.
					mandatory.value = true;
					await nextTick();

					// Still allow the user to manually close it afterwards
					mandatory.value = false;
				}
			}
		);

		return {
			openDetail,
			mandatory,
		};
	},
});
</script>

<style lang="scss" scoped>
.sidebar-detail-group {
	display: contents;
}
</style>
