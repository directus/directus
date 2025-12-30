<script setup lang="ts">
import VTextarea from './v-textarea.vue';
import { ref } from 'vue';

const value = ref(`This is some text that will be displayed in the textarea.
This is a new line.`);
</script>

<template>
	<Story title="VTextarea">
		<VTextarea v-model="value" />

		<template #controls>
			<HstTextarea v-model="value" title="Value" />
		</template>
	</Story>
</template>
