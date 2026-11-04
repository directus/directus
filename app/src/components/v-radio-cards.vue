<script setup lang="ts">
import { useId } from 'vue';
import CardContent from './v-choice-cards/card-content.vue';
import { focusAdjacentCard } from './v-choice-cards/focus-adjacent-card';
import type { ChoiceCardItem } from './v-choice-cards/types';

interface Props {
	items: ChoiceCardItem[];
	modelValue?: string | number | null;
	disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	modelValue: null,
	disabled: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: string | number];
}>();

// Plain buttons instead of Reka RadioGroup, which selects on arrow focus and collapses the group to one Tab stop.
const groupId = useId();
</script>

<template>
	<div
		role="radiogroup"
		class="v-radio-cards choice-cards"
		:aria-disabled="disabled || undefined"
		@keydown="focusAdjacentCard"
	>
		<button
			v-for="(item, index) in items"
			:key="item.value"
			type="button"
			role="radio"
			:value="item.value"
			class="v-radio-card choice-card"
			:class="{ custom: $slots.item }"
			:aria-checked="modelValue === item.value"
			:data-state="modelValue === item.value ? 'checked' : 'unchecked'"
			:disabled="item.disabled || disabled"
			:aria-labelledby="item.label ? `${groupId}-${index}-label` : undefined"
			:aria-describedby="item.description ? `${groupId}-${index}-description` : undefined"
			@click="emit('update:modelValue', item.value)"
		>
			<slot
				name="item"
				:item="item"
				:index="index"
				:selected="modelValue === item.value"
				:label-id="`${groupId}-${index}-label`"
				:description-id="`${groupId}-${index}-description`"
			>
				<CardContent
					:item="item"
					:label-id="`${groupId}-${index}-label`"
					:description-id="`${groupId}-${index}-description`"
				/>
			</slot>
		</button>
	</div>
</template>

<style lang="scss" scoped>
@use './v-choice-cards/styles';

@include styles.choice-cards;

.v-radio-cards {
	--choice-cards-color: var(--v-radio-cards-color, var(--theme--primary));
}
</style>
