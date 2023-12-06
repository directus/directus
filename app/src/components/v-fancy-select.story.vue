<script setup lang="ts">
import { ref } from 'vue';
import VFancySelect from './v-fancy-select.vue';

function initState() {
	return {
		items: [
			{
				icon: 'person',
				value: 'person',
				text: 'Person',
			},
			{
				icon: 'directions_car',
				value: 'car',
				text: 'Car',
			},
			{
				divider: true,
			},
			{
				icon: 'home',
				value: 'home',
				text: 'Home',
			},
		],
	};
}

const value = ref();
</script>

<template>
	<Story title="VFancySelect" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-fancy-select v-model="value" v-bind="state">My Button</v-fancy-select>
		</template>

		<template #controls>
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
