<script setup lang="ts">
import { ref } from 'vue';
import VSelect from './v-select.vue';

function initState() {
	return {
		items: [
			{
				text: 'Item 1',
				value: 'item1',
			},
			{
				text: 'Item 2',
				value: 'item2',
			},
			{
				text: 'Item 3',
				value: 'item3',
			},
		],
	};
}

const value = ref('item2');
</script>

<template>
	<Story title="VSelect" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VSelect v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
