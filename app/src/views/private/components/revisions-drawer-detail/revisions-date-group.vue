<template>
	<v-divider @click="toggleExpand" showExpandIcon :expand="expand">
		{{ group.dateFormatted }}
	</v-divider>

	<transition-expand class="scroll-container">
		<div v-show="expand">
			<revision-item
				v-for="(item, index) in group.revisions"
				:key="item.id"
				:revision="item"
				:last="index === group.revisions.length - 1"
				@click="openModal(item.id)"
			/>
		</div>
	</transition-expand>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import RevisionItem from './revision-item.vue';

export default defineComponent({
	components: { RevisionItem },
	props: {
		group: {
			type: Object,
			required: true,
		},
		openModal: {
			type: Function,
			required: true,
		},
	},
	setup() {
		const expand = ref(true);

		return {
			expand,
			toggleExpand,
		};

		function toggleExpand() {
			expand.value = !expand.value;
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	position: sticky;
	top: 0;
	z-index: 3;
	margin-top: 8px;
	margin-bottom: 8px;
	padding-top: 8px;
	padding-bottom: 8px;
	background-color: var(--background-normal);
	box-shadow: 0 0 4px 2px var(--background-normal);
	cursor: pointer;

	&:first-of-type {
		margin-top: 0;
	}
}
</style>
