<template>
	<v-item-group class="drawer-detail-group" v-model="openDetail">
		<slot />
	</v-item-group>
</template>

<script lang="ts">
import { createComponent, ref, watch, toRefs } from '@vue/composition-api';

export default createComponent({
	props: {
		drawerOpen: {
			type: Boolean,
			default: false
		}
	},
	setup(props) {
		// By syncing the opened item here, we can force close the module once the drawer closes
		const openDetail = ref<string[]>([]);

		watch(
			() => props.drawerOpen,
			newOpenState => {
				if (newOpenState === false) {
					openDetail.value = [];
				}
			}
		);

		return {
			openDetail
		};
	}
});
</script>
