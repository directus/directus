<template>
	<v-detail v-model="expand" :label="group.dateFormatted" class="revisions-date-group">
		<div v-show="expand" class="scroll-container">
			<revision-item
				v-for="(item, index) in group.revisions"
				:key="item.id"
				:revision="item"
				:last="index === group.revisions.length - 1"
				@click="$emit('click', item.id)"
			/>
		</div>
	</v-detail>
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

<style scoped></style>
