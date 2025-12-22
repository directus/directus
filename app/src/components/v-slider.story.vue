<script setup lang="ts">
import { ref } from 'vue';
import VSlider from './v-slider.vue';

const value = ref(50);
</script>

<template>
	<Story title="VSlider">
		<VSlider v-model="value" />

		<template #controls>
			<HstNumber v-model="value" title="Value" />
		</template>
	</Story>
</template>
