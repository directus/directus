<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { useId } from 'vue';
import VIcon from './v-icon/v-icon.vue';

export interface RadioCardItem {
	/** Value emitted when this card is selected */
	value: string | number;
	/** Primary text displayed on the card */
	label?: string;
	/** Secondary text displayed below the label */
	description?: string;
	/** Material icon name displayed at the top of the card */
	icon?: string;
	/** Disable this individual card */
	disabled?: boolean;
}

interface Props {
	/** List of card options to display */
	items: RadioCardItem[];
	/** The currently selected value */
	modelValue?: string | number | null;
	/** Disable all cards */
	disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	modelValue: null,
	disabled: false,
});

const emit = defineEmits<{
	'update:modelValue': [value: string | number];
}>();

const groupId = useId();
</script>

<template>
	<RadioGroupRoot
		class="v-radio-cards"
		:model-value="modelValue != null ? modelValue : undefined"
		:disabled="disabled"
		@update:model-value="emit('update:modelValue', $event as string | number)"
	>
		<RadioGroupItem
			v-for="(item, index) in items"
			:key="item.value"
			:value="item.value"
			:disabled="item.disabled || disabled"
			class="v-radio-card"
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
				<div v-if="item.icon" class="icon-box">
					<VIcon :name="item.icon" />
				</div>
				<div class="text">
					<p v-if="item.label" :id="`${groupId}-${index}-label`" class="label type-text-bold">{{ item.label }}</p>
					<p v-if="item.description" :id="`${groupId}-${index}-description`" class="description type-text">
						{{ item.description }}
					</p>
				</div>
			</slot>
		</RadioGroupItem>
	</RadioGroupRoot>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-radio-cards-color  [var(--theme--primary)]

*/

.v-radio-cards {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	gap: 1rem;
}

.v-radio-card:not(.custom) {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
	background-color: transparent;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: 0.75rem;
	text-align: start;
	cursor: pointer;
	transition-property: border-color, background-color;
	transition-duration: var(--fast);
	transition-timing-function: var(--transition);
	appearance: none;

	&:hover:not(:disabled):not([data-state='checked']) {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&[data-state='checked'] {
		border-color: var(--v-radio-cards-color, var(--theme--primary));
		background-color: color-mix(in srgb, var(--v-radio-cards-color, var(--theme--primary)) 10%, transparent);

		.icon-box {
			background-color: color-mix(in srgb, var(--v-radio-cards-color, var(--theme--primary)) 15%, transparent);

			.v-icon {
				--v-icon-color: var(--v-radio-cards-color, var(--theme--primary));
			}
		}

		.label {
			color: var(--v-radio-cards-color, var(--theme--primary));
		}

		.description {
			color: color-mix(in srgb, var(--v-radio-cards-color, var(--theme--primary)) 70%, transparent);
		}
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
}

.icon-box {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 2.75rem;
	block-size: 2.75rem;
	background-color: var(--theme--background-subdued);
	border-radius: 0.75rem;
	margin-block-end: 0.25rem;
	transition-property: background-color;
	transition-duration: var(--fast);
	transition-timing-function: var(--transition);

	.v-icon {
		--v-icon-color: var(--theme--foreground-subdued);
	}
}

.text {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.label {
	color: var(--theme--foreground);
	font-weight: 600;
}

.description {
	color: var(--theme--foreground-subdued);
}
</style>
