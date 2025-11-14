<script setup lang="ts">
import { ref } from 'vue';
import VDialog from './v-dialog.vue';

const value = ref(false);
</script>

<template>
	<Story title="VDialog">
		<v-button @click="value = true">Open</v-button>
		<v-dialog v-model="value">
			<v-card>
				<v-card-title>Dialog</v-card-title>
				<v-card-text>Lorem Ipsum</v-card-text>
				<v-card-actions>
					<v-button secondary @click="value = false">Done</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #controls>
			<HstCheckbox v-model="value" title="Value" />
		</template>
	</Story>
</template>
