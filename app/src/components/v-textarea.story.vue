<script setup lang="ts">
import { ref } from 'vue';
import VTextarea from './v-textarea.vue';

const value = ref(`This is some text that will be displayed in the textarea.
This is a new line.`);
</script>

<template>
	<Story title="VTextarea">
		<v-textarea v-model="value" />

		<template #controls>
			<HstTextarea v-model="value" title="Value" />
		</template>
	</Story>
</template>
