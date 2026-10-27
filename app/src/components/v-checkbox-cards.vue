<script setup lang="ts" generic="T extends string | number = string | number">
import { CheckboxGroupRoot, CheckboxRoot } from 'reka-ui';
import { computed, useId } from 'vue';
import CardContent from './v-choice-cards/card-content.vue';
import type { ChoiceCardItem } from './v-choice-cards/types';

interface Props {
	/** List of card options to display */
	items: ChoiceCardItem<T>[];
	/** The currently selected values */
	modelValue?: T[] | null;
	/** Disable all cards */
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: () => [],
	disabled: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: T[]];
}>();

const groupId = useId();
const selectedValues = computed(() => props.modelValue ?? []);
</script>

<template>
	<CheckboxGroupRoot
		:roving-focus="false"
		role="group"
		class="v-checkbox-cards choice-cards"
		:model-value="selectedValues"
		:disabled="disabled"
		@update:model-value="emit('update:modelValue', $event as T[])"
	>
		<CheckboxRoot
			v-for="(item, index) in items"
			:key="item.value"
			:value="item.value"
			:disabled="item.disabled || disabled"
			class="v-checkbox-card choice-card"
			:class="{ custom: $slots.item, unselected: selectedValues.length > 0 && !selectedValues.includes(item.value) }"
			:aria-labelledby="item.label ? `${groupId}-${index}-label` : undefined"
			:aria-describedby="item.description ? `${groupId}-${index}-description` : undefined"
		>
			<slot
				name="item"
				:item="item"
				:index="index"
				:selected="selectedValues.includes(item.value)"
				:label-id="`${groupId}-${index}-label`"
				:description-id="`${groupId}-${index}-description`"
			>
				<CardContent
					:item="item"
					:label-id="`${groupId}-${index}-label`"
					:description-id="`${groupId}-${index}-description`"
				/>
			</slot>
		</CheckboxRoot>
	</CheckboxGroupRoot>
</template>

<style lang="scss" scoped>
@use './v-choice-cards/styles';

@include styles.choice-cards;

.v-checkbox-cards {
	--choice-cards-color: var(--v-checkbox-cards-color, var(--theme--primary));
}
</style>
