<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { ref, useId, watch } from 'vue';
import CardContent from './v-choice-cards/card-content.vue';
import type { ChoiceCardItem } from './v-choice-cards/types';

interface Props {
	/** List of card options to display */
	items: ChoiceCardItem[];
	/** The currently selected value */
	modelValue?: string | number | null;
	/** Disable all cards */
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	disabled: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: string | number];
}>();

const groupId = useId();
const selectedValue = ref(props.modelValue);

watch(
	() => props.modelValue,
	(value) => {
		selectedValue.value = value;
	},
);

function updateValue(value: string | number) {
	selectedValue.value = value;
	emit('update:modelValue', value);
}
</script>

<template>
	<RadioGroupRoot
		class="v-radio-cards choice-cards"
		:model-value="selectedValue ?? undefined"
		:disabled="disabled"
		@update:model-value="updateValue($event as string | number)"
	>
		<RadioGroupItem
			v-for="(item, index) in items"
			:key="item.value"
			:value="item.value"
			:disabled="item.disabled || disabled"
			class="v-radio-card choice-card"
			:class="{ custom: $slots.item }"
			:aria-labelledby="item.label ? `${groupId}-${index}-label` : undefined"
			:aria-describedby="item.description ? `${groupId}-${index}-description` : undefined"
		>
			<slot
				name="item"
				:item="item"
				:index="index"
				:selected="selectedValue === item.value"
				:label-id="`${groupId}-${index}-label`"
				:description-id="`${groupId}-${index}-description`"
			>
				<CardContent
					:item="item"
					:label-id="`${groupId}-${index}-label`"
					:description-id="`${groupId}-${index}-description`"
				/>
			</slot>
		</RadioGroupItem>
	</RadioGroupRoot>
</template>

<style lang="scss" scoped>
@use './v-choice-cards/styles';

@include styles.choice-cards;

.v-radio-cards {
	--choice-cards-color: var(--v-radio-cards-color, var(--theme--primary));
}
</style>
