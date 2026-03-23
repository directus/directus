<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AppModelDefinition } from '@/ai/models';
import { useAiStore } from '@/ai/stores/use-ai';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

const props = defineProps<{
	/** When provided, the component is controlled externally instead of using the AI store */
	modelValue?: AppModelDefinition | null;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: AppModelDefinition): void;
}>();

const { t } = useI18n();
const aiStore = useAiStore();

const isControlled = computed(() => props.modelValue !== undefined);

const currentModel = computed(() => (isControlled.value ? props.modelValue : aiStore.selectedModel));

const availableModels = computed(() => {
	if (!isControlled.value && aiStore.isProviderLocked && aiStore.selectedModel) {
		return aiStore.models.filter((m) => m.provider === aiStore.selectedModel!.provider);
	}

	return aiStore.models;
});

const isSelectorDisabled = computed(
	() => !isControlled.value && aiStore.isProviderLocked && availableModels.value.length <= 1,
);

function onSelect(model: AppModelDefinition) {
	if (isControlled.value) {
		emit('update:modelValue', model);
	} else {
		aiStore.selectModel(model);
	}
}
</script>

<template>
	<VMenu placement="bottom-start" show-arrow :disabled="isSelectorDisabled">
		<template #activator="{ toggle }">
			<button
				v-tooltip.bottom="!isControlled && aiStore.isProviderLocked ? t('ai.provider_locked_tooltip') : undefined"
				class="select-trigger"
				:disabled="isSelectorDisabled"
				@click="toggle"
			>
				<template v-if="currentModel">
					<component :is="currentModel.icon" class="model-icon small" />
					{{ currentModel.name }}
				</template>

				<VIcon v-if="!isControlled && aiStore.isProviderLocked" name="lock" x-small class="select-icon" />
				<VIcon v-else name="expand_more" x-small class="select-icon" />
			</button>
		</template>

		<VList>
			<template
				v-for="(modelDefinition, index) in availableModels"
				:key="`${modelDefinition.provider}:${modelDefinition.model}`"
			>
				<VDivider v-if="index !== 0 && modelDefinition.provider !== availableModels[index - 1]?.provider" />

				<VListItem :active="currentModel === modelDefinition" clickable @click="onSelect(modelDefinition)">
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
	gap: 0.25rem;
	background: transparent;
	border: var(--theme--border-width) solid transparent;
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground);
	font-family: var(--theme--fonts--sans--font-family);
	font-size: 0.6875rem;
	cursor: pointer;
	transition: all var(--fast) var(--transition);

	&:disabled {
		color: var(--theme--foreground-subdued);
		cursor: not-allowed;
	}
}

.model-icon {
	inline-size: 0.875rem;
	block-size: 0.875rem;

	&.small {
		inline-size: 0.6875rem;
		block-size: 0.6875rem;
	}
}

.model-list-item-content {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.select-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
