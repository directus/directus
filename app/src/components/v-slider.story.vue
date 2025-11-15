<script setup lang="ts">
import { ref } from 'vue';
import VSlider from './v-slider.vue';

const value = ref(50);
</script>

<template>
	<Story title="VSlider" icon="material-symbols:commit">
		<v-slider v-model="value" />

		<template #controls>
			<HstNumber v-model="value" title="Value" />
		</template>
	</Story>
</template>
