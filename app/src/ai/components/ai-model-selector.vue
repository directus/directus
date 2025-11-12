<script setup lang="ts">
import { formatTitle } from '@directus/format-title';
import { useAiStore } from '@/ai/stores/use-ai';
import { computed, type Component } from 'vue';
import Openai from '@/ai/components/logos/openai.vue';
import Claude from '@/ai/components/logos/claude.vue';
import { extractFromId } from '../utils/extract-from-id';

interface ModelIcons {
	[key: string]: Component;
}

const modelIcons: ModelIcons = {
	openai: Openai,
	anthropic: Claude,
};

const aiStore = useAiStore();

const currentProviderIcon = computed(() => {
	return aiStore.currentProvider ? modelIcons[aiStore.currentProvider] : null;
});

const modelsWithMeta = computed(() => {
	return aiStore.modelIds.map((id) => {
		const { provider, model } = extractFromId(id);
		return {
			id,
			model,
			provider,
			icon: modelIcons[provider] ?? null,
		};
	});
});
</script>

<template>
	<v-menu placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<button class="select-trigger" @click="toggle">
				<component :is="currentProviderIcon" v-if="currentProviderIcon" class="model-icon small" />
				{{ formatTitle(aiStore.currentModel || '') }}
				<v-icon name="expand_more" x-small class="select-icon" />
			</button>
		</template>

		<v-list>
			<template v-for="(item, index) in modelsWithMeta" :key="item.id">
				<v-divider v-if="index !== 0 && item.provider !== modelsWithMeta[index - 1]?.provider" />
				<v-list-item
					:active="aiStore.selectedModelId === item.id"
					clickable
					@click="aiStore.selectedModelId = item.id"
				>
					<v-list-item-icon>
						<component :is="item.icon" v-if="item.icon" class="model-icon" />
					</v-list-item-icon>
					<v-list-item-content>
						<div class="model-list-item-content">
							<v-text-overflow :text="formatTitle(item.model)" />
						</div>
					</v-list-item-content>
					<template v-if="aiStore.selectedModelId === item.id" #append>
						<v-icon name="check" x-small />
					</template>
				</v-list-item>
			</template>
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
