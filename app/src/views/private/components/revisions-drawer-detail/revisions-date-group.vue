<template>
	<v-divider show-expand-icon :expand="expand" @click="expand = !expand">
		<template #icon>
			<v-icon :name="expand ? 'expand_less' : 'expand_more'" />
		</template>
		{{ group.dateFormatted }}
	</v-divider>

	<transition-expand class="scroll-container">
		<div v-show="expand">
			<revision-item
				v-for="(item, index) in group.revisions"
				:key="item.id"
				:revision="item"
				:last="index === group.revisions.length - 1"
				@click="$emit('click', item.id)"
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
	},
	emits: ['click'],
	setup() {
		const expand = ref(true);

		return { expand };
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
