<template>
	<v-textarea
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
	</v-textarea>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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
	}
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

<style lang="scss" scoped>
.v-textarea {
	&.monospace {
		--v-textarea-font-family: var(--family-monospace);
	}

	&.serif {
		--v-textarea-font-family: var(--family-serif);
	}

	&.sans-serif {
		--v-textarea-font-family: var(--family-sans-serif);
	}
}

.remaining {
	position: absolute;
	right: 10px;
	bottom: 5px;
	color: var(--foreground-subdued);
	font-weight: 600;
	text-align: right;
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
	color: var(--warning);
}
</style>
