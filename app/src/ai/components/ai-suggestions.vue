<script setup lang="ts">
import { useAiStore } from '../stores/use-ai';

const aiStore = useAiStore();

defineProps<{
	suggestions: string[];
}>();
</script>

<template>
	<div class="ai-suggestions">
		<v-button
			v-for="(suggestion, index) in suggestions"
			:key="index"
			outlined
			x-small
			class="suggestion-button"
			@click="aiStore.addMessage(suggestion)"
		>
			{{ suggestion }}
		</v-button>
	</div>
</template>

<style scoped>
.ai-suggestions {
	inline-size: 100%;
	block-size: 100%;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;

}
</style>
