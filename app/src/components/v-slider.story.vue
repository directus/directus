<script setup lang="ts">
import { ref } from 'vue';
import VSlider from './v-slider.vue';

const value = ref(50);
</script>

<template>
	<Story title="VSlider">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-slider v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstNumber v-model="value" title="Value" />
		</template>
	</Story>
</template>
