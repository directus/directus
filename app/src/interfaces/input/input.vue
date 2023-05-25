<template>
	<v-input
		:autofocus="autofocus"
		:model-value="value"
		:nullable="!clear"
		:placeholder="placeholder"
		:disabled="disabled"
		:trim="trim"
		:type="inputType"
		:class="font"
		:db-safe="dbSafe"
		:slug="slug"
		:min="min"
		:max="max"
		:step="step"
		:dir="direction"
		:autocomplete="masked ? 'new-password' : 'off'"
		@update:model-value="$emit('input', $event)"
	>
		<template v-if="iconLeft" #prepend><v-icon :name="iconLeft" /></template>
		<template v-if="(percentageRemaining !== null && percentageRemaining <= 20) || iconRight || softLength" #append>
			<span
				v-if="(percentageRemaining !== null && percentageRemaining <= 20) || softLength"
				class="remaining"
				:class="{
					warning: percentageRemaining! < 10,
					danger: percentageRemaining! < 5,
				}"
			>
				{{ charsRemaining }}
			</span>
			<v-icon v-if="iconRight" :class="{ hide: percentageRemaining && percentageRemaining <= 20 }" :name="iconRight" />
		</template>
	</v-input>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: string | number | null;
		type?: string;
		clear?: boolean;
		disabled?: boolean;
		placeholder?: string;
		masked?: boolean;
		iconLeft?: string;
		iconRight?: string;
		trim?: boolean;
		font?: 'sans-serif' | 'serif' | 'monospace';
		length?: number;
		softLength?: number;
		dbSafe?: boolean;
		autofocus?: boolean;
		slug?: boolean;
		min?: number;
		max?: number;
		step?: number;
		direction?: string;
	}>(),
	{
		font: 'sans-serif',
		step: 1,
	}
);

defineEmits(['input']);

const charsRemaining = computed(() => {
	if (typeof props.value === 'number') return null;

	if (!props.length && !props.softLength) return null;
	if (!props.value && !props.softLength) return null;
	if (!props.value && props.softLength) return props.softLength;
	if (props.softLength) return +props.softLength - props.value!.length;
	if (props.length) return +props.length - props.value!.length;
	return null;
});

const percentageRemaining = computed(() => {
	if (typeof props.value === 'number') return null;

	if (!props.length && !props.softLength) return null;
	if (!props.value) return 100;

	if (props.softLength) return 100 - (props.value.length / +props.softLength) * 100;
	if (props.length) return 100 - (props.value.length / +props.length) * 100;

	return 100;
});

const inputType = computed(() => {
	if (props.masked) return 'password';
	if (['bigInteger', 'integer', 'float', 'decimal'].includes(props.type!)) return 'number';
	return 'text';
});
</script>

<style lang="scss" scoped>
.v-input {
	&.monospace {
		--v-input-font-family: var(--family-monospace);
	}

	&.serif {
		--v-input-font-family: var(--family-serif);
	}

	&.sans-serif {
		--v-input-font-family: var(--family-sans-serif);
	}
}

.remaining {
	display: none;
	width: 24px;
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

.danger {
	color: var(--danger);
}
</style>
