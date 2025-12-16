<script setup lang="ts">
import { useAiStore } from '@/ai/stores/use-ai';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

const aiStore = useAiStore();
</script>

<template>
	<v-menu placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<button class="select-trigger" @click="toggle">
				<template v-if="aiStore.selectedModel">
					<component :is="aiStore.selectedModel.icon" class="model-icon small" />
					{{ aiStore.selectedModel.name }}
				</template>

				<v-icon name="expand_more" x-small class="select-icon" />
			</button>
		</template>

		<v-list>
			<template
				v-for="(modelDefinition, index) in aiStore.models"
				:key="`${modelDefinition.provider}:${modelDefinition.model}`"
			>
				<v-divider v-if="index !== 0 && modelDefinition.provider !== aiStore.models[index - 1]?.provider" />

				<v-list-item
					:active="aiStore.selectedModel === modelDefinition"
					clickable
					@click="aiStore.selectModel(modelDefinition)"
				>
					<v-list-item-icon>
						<component :is="modelDefinition.icon" v-if="modelDefinition.icon" class="model-icon" />
					</v-list-item-icon>
					<v-list-item-content>
						<div class="model-list-item-content">
							<v-text-overflow :text="modelDefinition.name" />
						</div>
					</v-list-item-content>
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
