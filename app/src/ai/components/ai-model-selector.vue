<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiStore } from '@/ai/stores/use-ai';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

const { t } = useI18n();
const aiStore = useAiStore();

const availableModels = computed(() => {
	if (!aiStore.isProviderLocked || !aiStore.selectedModel) return aiStore.models;
	return aiStore.models.filter((m) => m.provider === aiStore.selectedModel!.provider);
});

const isSelectorDisabled = computed(() => aiStore.isProviderLocked && availableModels.value.length <= 1);
</script>

<template>
	<VMenu placement="bottom-start" show-arrow :disabled="isSelectorDisabled">
		<template #activator="{ toggle }">
			<button
				v-tooltip.bottom="aiStore.isProviderLocked ? t('ai.provider_locked_tooltip') : undefined"
				class="select-trigger"
				:disabled="isSelectorDisabled"
				@click="toggle"
			>
				<template v-if="aiStore.selectedModel">
					<component :is="aiStore.selectedModel.icon" class="model-icon small" />
					{{ aiStore.selectedModel.name }}
				</template>

				<VIcon v-if="aiStore.isProviderLocked" name="lock" x-small class="select-icon" />
				<VIcon v-else name="expand_more" x-small class="select-icon" />
			</button>
		</template>

		<VList>
			<template
				v-for="(modelDefinition, index) in availableModels"
				:key="`${modelDefinition.provider}:${modelDefinition.model}`"
			>
				<VDivider v-if="index !== 0 && modelDefinition.provider !== availableModels[index - 1]?.provider" />

				<VListItem
					:active="aiStore.selectedModel === modelDefinition"
					clickable
					@click="aiStore.selectModel(modelDefinition)"
				>
					<VListItemIcon>
						<component :is="modelDefinition.icon" v-if="modelDefinition.icon" class="model-icon" />
					</VListItemIcon>
					<VListItemContent>
						<div class="model-list-item-content">
							<VTextOverflow :text="modelDefinition.name" />
						</div>
					</VListItemContent>
				</VListItem>
			</template>
		</VList>
	</VMenu>
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
