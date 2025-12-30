<script setup lang="ts">
import VInput from './v-input.vue';
import { ref } from 'vue';

const value = ref('Shut up and take my money. 💸');
</script>

<template>
	<Story title="VInput">
		<VInput v-model="value" />

		<template #controls>
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
