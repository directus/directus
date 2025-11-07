<script setup lang="ts">
import { formatTitle } from '@directus/format-title';
import { useAiStore } from '@/ai/stores/use-ai';
import Openai from '@/ai/components/logos/openai.vue';
import Anthropic from '@/ai/components/logos/anthropic.vue';

const modelIcons = {
	openai: Openai,
	anthropic: Anthropic,
};

const aiStore = useAiStore();
</script>

<template>
	<v-menu placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<button class="select-trigger" @click="toggle">
				<component :is="modelIcons[aiStore.currentProvider as keyof typeof modelIcons]" class="model-icon small" />
				{{ formatTitle(aiStore.currentModel || '') }}
				<v-icon name="expand_more" x-small class="select-icon" />
			</button>
		</template>

		<v-list>
			<v-list-item
				v-for="model in aiStore.models"
				:key="model"
				:active="aiStore.selectedModel === model"
				clickable
				@click="aiStore.selectedModel = model"
			>
				<v-list-item-content>
					<div class="model-list-item-content">
						<component :is="modelIcons[model.split('/')[0] as keyof typeof modelIcons]" class="model-icon" />
						<v-text-overflow :text="formatTitle(model.split('/')[1] || '')" />
					</div>
				</v-list-item-content>
				<template v-if="aiStore.selectedModel === model" #append>
					<v-icon name="check" x-small />
				</template>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style scoped>
.select-trigger {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 4px;
	background: transparent;
	border: var(--theme--border-width) solid transparent;
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	font-size: 12px;
	cursor: pointer;
	transition: all var(--fast) var(--transition);

	&:disabled {
		color: var(--theme--foreground-subdued);
		cursor: not-allowed;
	}
}

.model-icon {
	inline-size: 16px;
	block-size: 16px;

	&.small {
		inline-size: 12px;
		block-size: 12px;
	}
}

.model-list-item-content {
	display: flex;
	align-items: center;
	gap: 4px;
}

.select-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
