<script setup lang="ts">
import { ref } from 'vue';
import VTextarea from './v-textarea.vue';

const value = ref(`This is some text that will be displayed in the textarea.
This is a new line.`);
</script>

<template>
	<Story title="VTextarea">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-textarea v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstTextarea v-model="value" title="Value" />
		</template>
	</Story>
</template>
