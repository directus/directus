<script setup lang="ts">
import { ref } from 'vue';
import TransitionExpand from './expand.vue';

const show = ref(true);
</script>

<template>
	<Story title="Transition/TransitionExpand">
		<transition-expand>
			<div v-if="show" class="box">This is inside transition expand.</div>
		</transition-expand>

		<template #controls>
			<HstCheckbox v-model="show" title="Toggle" />
		</template>
	</Story>
</template>

<style>
.box {
	background-color: var(--theme--background-normal);
	height: 200px;
	width: 400px;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
