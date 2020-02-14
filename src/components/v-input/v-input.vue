<template>
	<div class="v-input">
		<div v-if="$slots['prepend-outer']" class="prepend-outer">
			<slot name="prepend-outer" :value="value" :disabled="disabled" />
		</div>
		<div class="input" :class="{ disabled, monospace, 'full-width': fullWidth }">
			<div v-if="$slots.prepend" class="prepend">
				<slot name="prepend" :value="value" :disabled="disabled" />
			</div>
			<span v-if="prefix" class="prefix">{{ prefix }}</span>
			<input
				v-bind="$attrs"
				v-focus="autofocus"
				v-on="_listeners"
				:disabled="disabled"
				:value="value"
			/>
			<span v-if="suffix" class="suffix">{{ suffix }}</span>
			<div v-if="$slots.append" class="append">
				<slot name="append" :value="value" :disabled="disabled" />
			</div>
		</div>
		<div v-if="$slots['append-outer']" class="append-outer">
			<slot name="append-outer" :value="value" :disabled="disabled" />
		</div>
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';

export default createComponent({
	inheritAttrs: false,
	props: {
		autofocus: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		prefix: {
			type: String,
			default: null
		},
		suffix: {
			type: String,
			default: null
		},
		monospace: {
			type: Boolean,
			default: false
		},
		fullWidth: {
			type: Boolean,
			default: false
		},
		value: {
			type: [String, Number],
			default: null
		}
	},
	setup(props, { emit, listeners }) {
		const _listeners = computed(() => ({
			...listeners,
			input: emitValue
		}));

		return { _listeners };

		function emitValue(event: InputEvent) {
			emit('input', (event.target as HTMLInputElement).value);
		}
	}
});
</script>

<style lang="scss" scoped>
.v-input {
	display: flex;
	align-items: center;
	height: var(--input-height);

	.prepend-outer {
		margin-right: 8px;
	}

	.input {
		display: flex;
		align-items: center;
		height: 100%;
		padding: var(--input-padding);
		color: var(--input-foreground-color);
		background-color: var(--input-background-color);
		border: var(--input-border-width) solid var(--input-border-color);
		border-radius: var(--input-border-radius);
		transition: border-color var(--fast) var(--transition);

		.prepend {
			margin-right: 8px;
		}

		&:not(.disabled):hover {
			color: var(--input-foreground-color-hover);
			background-color: var(--input-background-color-hover);
			border-color: var(--input-border-color-hover);
		}

		&:not(.disabled):focus-within {
			color: var(--input-foreground-color-focus);
			background-color: var(--input-background-color-focus);
			border-color: var(--input-border-color-focus);
		}

		&.disabled {
			color: var(--input-foreground-color-disabled);
			background-color: var(--input-background-color-disabled);
			border-color: var(--input-border-color-disabled);
		}

		&.full-width {
			width: 100%;
		}

		input {
			flex-grow: 1;
			height: 100%;
			background-color: transparent;
			border: none;
			appearance: none;

			&::placeholder {
				color: var(--input-foreground-color-empty);
			}
		}

		&.monospace {
			input {
				font-family: var(--family-monospace);
			}
		}

		.prefix,
		.suffix {
			color: var(--input-foreground-color-empty);
		}

		.append {
			margin-left: 8px;
		}
	}

	.append-outer {
		margin-left: 8px;
	}
}
</style>
