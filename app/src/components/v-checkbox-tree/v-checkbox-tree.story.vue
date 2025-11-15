<script setup lang="ts">
import { ref } from 'vue';
import VCheckboxTree from './v-checkbox-tree.vue';

function initState() {
	return {
		choices: [
			{
				text: 'Choice 1',
				value: 'choice-1',
				children: [
					{
						text: 'Choice 1.1',
						value: 'choice-1.1',
					},
					{
						text: 'Choice 1.2',
						value: 'choice-1.2',
					},
				],
			},
			{
				text: 'Choice 2',
				value: 'choice-2',
			},
			{
				text: 'Choice 3',
				value: 'choice-3',
			},
		],
	};
}

const value = ref([]);
</script>

<template>
	<Story title="VCheckboxTree" icon="material-symbols:checklist" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-checkbox-tree v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstJson v-model="value" title="Value" />
		</template>
	</Story>
</template>
