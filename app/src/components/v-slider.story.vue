<script setup lang="ts">
import VSlider from './v-slider.vue';
import { ref } from 'vue';

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
