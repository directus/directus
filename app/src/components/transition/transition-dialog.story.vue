<script setup lang="ts">
import { ref } from 'vue';
import TransitionDialog from './dialog.vue';

const show = ref(true);
</script>

<template>
	<Story title="Transition/TransitionDialog">
		<transition-dialog>
			<div v-if="show" class="box">This is inside transition dialog.</div>
		</transition-dialog>

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
