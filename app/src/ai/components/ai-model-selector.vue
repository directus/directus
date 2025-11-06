<script setup lang="ts">
import { formatTitle } from '@directus/format-title';
import { useAiStore } from '../stores/use-ai';

const aiStore = useAiStore();
</script>

<template>
	<v-menu placement="top-end" show-arrow>
		<template #activator="{ toggle }">
			<button class="select-trigger" @click="toggle">
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
					<v-text-overflow :text="formatTitle(model.split('/')[1] || '')" />
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

.select-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
