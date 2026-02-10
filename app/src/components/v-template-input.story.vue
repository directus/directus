<script setup lang="ts">
import { logEvent } from 'histoire/client';
import { ref } from 'vue';
import VTemplateInput from './v-template-input.vue';

function initState() {
	return {
		multiline: true,
		'trigger-character': '@',
		items: {
			item1: 'Test1',
			item2: 'Test2',
		},
		captureGroup: '(@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})',
	};
}

const value = ref('Hey ho everyone, I am a new comment!');
</script>

<template>
	<Story title="VTemplateInput" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VTemplateInput
				v-model="value"
				v-bind="state"
				@trigger="logEvent('trigger', $event)"
				@deactivate="logEvent('deactivate', $event)"
				@up="logEvent('up', $event)"
				@down="logEvent('down', $event)"
				@enter="logEvent('enter', $event)"
			/>
		</template>

		<template #controls>
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
