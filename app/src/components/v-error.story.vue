<script setup lang="ts">
import { ref } from 'vue';
import VError from './v-error.vue';

const error = ref({
	message: 'My Error',
	extensions: {
		code: 'INVALID_PAYLOAD',
	},
});
</script>

<template>
	<Story title="VError">
		<v-error :error />

		<template #controls>
			<HstJson v-model="error" title="Error" />
		</template>
	</Story>
</template>
