<script setup lang="ts">
import { ref } from 'vue';

interface Model {
	provider: string;
	model: string;
	icon: string;
}

const models: Model[] = [
	{
		provider: 'openai',
		model: 'gpt-4o',
		icon: 'smart_toy',
	},
	{
		provider: 'anthropic',
		model: 'claude-3.5-sonnet',
		icon: 'smart_toy',
	},
	{
		provider: 'openai',
		model: 'gpt-4-turbo',
		icon: 'smart_toy',
	},
];

const selectedModel = ref(models[0]);

function selectModel(model: typeof models[0]) {
	selectedModel.value = model;
}
</script>

<template>
	<v-menu show-arrow placement="bottom-start">
		<template #activator="{ toggle }">
			<v-button x-small secondary @click="toggle">
				<p v-if="selectedModel">{{ selectedModel.model }}</p>
			</v-button>
		</template>

		<v-list>
			<v-list-item
				v-for="model in models"
				:key="`${model.provider}-${model.model}`"
				:active="selectedModel?.model === model.model && selectedModel?.provider === model.provider"
				clickable
				@click="selectModel(model)"
			>
				<v-list-item-icon>
					<v-icon :name="model.icon" />
				</v-list-item-icon>
				<v-list-item-content>
					<v-text-overflow :text="`${model.provider}/${model.model}`" />
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style scoped>

</style>
