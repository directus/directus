<script setup lang="ts">
import { computed } from 'vue';
import VTextarea from '@/components/v-textarea.vue';

const props = withDefaults(
	defineProps<{
		value: string | null;
		clear?: boolean;
		disabled?: boolean;
		placeholder?: string;
		trim?: boolean;
		font?: 'sans-serif' | 'serif' | 'monospace';
		softLength?: number;
		direction?: string;
	}>(),
	{
		font: 'sans-serif',
	},
);

defineEmits(['input']);

const charsRemaining = computed(() => {
	if (typeof props.value === 'number') return null;

	if (!props.softLength) return null;
	if (!props.value && props.softLength) return props.softLength;
	const realValue = props.value!.replaceAll('\n', ' ').length;

	if (props.softLength) return +props.softLength - realValue;
	return null;
});

const percentageRemaining = computed(() => {
	if (typeof props.value === 'number') return null;

	if (!props.softLength) return null;
	if (!props.value) return 100;

	if (props.softLength) return 100 - (props.value.length / +props.softLength) * 100;
	return 100;
});
</script>

<template>
	<VTextarea
		v-bind="{ placeholder, trim }"
		:model-value="value"
		:nullable="!clear"
		:disabled="disabled"
		:class="font"
		:dir="direction"
		@update:model-value="$emit('input', $event)"
	>
		<template v-if="(percentageRemaining && percentageRemaining <= 20) || softLength" #append>
			<span
				v-if="(percentageRemaining && percentageRemaining <= 20) || softLength"
				class="remaining"
				:class="{
					warning: percentageRemaining! < 10,
					danger: percentageRemaining! < 5,
				}"
			>
				{{ charsRemaining }}
			</span>
		</template>
	</VTextarea>
</template>

<style lang="scss" scoped>
.v-textarea {
	&.monospace {
		--v-textarea-font-family: var(--theme--fonts--monospace--font-family);
	}

	&.serif {
		--v-textarea-font-family: var(--theme--fonts--serif--font-family);
	}

	&.sans-serif {
		--v-textarea-font-family: var(--theme--fonts--sans--font-family);
	}
}

.remaining {
	position: absolute;
	inset-inline-end: 10px;
	inset-block-end: 5px;
	color: var(--theme--form--field--input--foreground-subdued);
	font-weight: 600;
	text-align: end;
	vertical-align: middle;
	font-feature-settings: 'tnum';
}

.v-input:focus-within .remaining {
	display: block;
}

.v-input:focus-within .hide {
	display: none;
}

.warning {
	color: var(--theme--warning);
}
</style>
