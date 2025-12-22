<script setup lang="ts">
import { ref } from 'vue';
import TransitionBounce from './bounce.vue';

const show = ref(true);
</script>

<template>
	<Story title="Transition/TransitionBounce">
		<TransitionBounce>
			<div v-if="show" class="box">This is inside transition bounce.</div>
		</TransitionBounce>

		<template #controls>
			<HstCheckbox v-model="show" title="Toggle" />
		</template>
	</Story>
</template>

<style>
.box {
	background-color: var(--theme--background-normal);
	block-size: 200px;
	inline-size: 400px;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
