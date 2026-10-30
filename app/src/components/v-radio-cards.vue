<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { computed, useId } from 'vue';
import CardContent from './v-choice-cards/card-content.vue';
import type { ChoiceCardItem } from './v-choice-cards/types';

interface Props {
	items: ChoiceCardItem[];
	modelValue?: string | number | null;
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
// Reka only counts focusable items on mount, so disabled changes must remount the group.
const focusabilityKey = computed(() => props.items.map((item) => Number(!(props.disabled || item.disabled))).join(''));
</script>

<template>
	<RadioGroupRoot
		:key="focusabilityKey"
		class="v-radio-cards choice-cards"
		:model-value="modelValue"
		:disabled="disabled"
		@update:model-value="emit('update:modelValue', $event as string | number)"
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
