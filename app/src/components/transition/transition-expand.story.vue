<script setup lang="ts">
import { ref } from 'vue';
import TransitionExpand from './expand.vue';

const show = ref(true);
</script>

<template>
	<Story title="Transition/TransitionExpand">
		<TransitionExpand>
			<div v-if="show" class="box">This is inside transition expand.</div>
		</TransitionExpand>

		<template #controls>
			<HstCheckbox v-model="show" title="Toggle" />
		</template>
	</Story>
</template>

<style>
.box {
	background-color: var(--theme--background-normal);
	block-size: 11.25rem;
	inline-size: 22.5rem;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
