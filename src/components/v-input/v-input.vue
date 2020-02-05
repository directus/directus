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
		height: 100%;
		display: flex;
		align-items: center;
		border: var(--input-border-width) solid var(--input-border-color);
		background-color: var(--input-background-color);
		border-radius: var(--border-radius);
		padding: var(--input-padding);
		transition: border-color var(--fast) var(--transition);

		.prepend {
			margin-right: 8px;
		}

		&:not(.disabled):hover {
			border-color: var(--input-border-color-hover);
		}

		&:not(.disabled):focus-within {
			border-color: var(--input-border-color-focus);
		}

		&.disabled {
			background-color: var(--input-background-color-disabled);
		}

		&.full-width {
			width: 100%;
		}

		&.monospace {
			input {
				font-family: var(--family-monospace);
			}
		}

		input {
			appearance: none;
			flex-grow: 1;
			height: 100%;
			border: none;
			background-color: transparent;
		}

		.prefix,
		.suffix {
			color: var(--input-border-color-focus);
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
