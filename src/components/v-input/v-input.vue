<template>
	<div
		class="v-input"
		@click="$emit('click', $event)"
		:class="{ 'full-width': fullWidth, 'has-click': hasClick }"
	>
		<div v-if="$slots['prepend-outer']" class="prepend-outer">
			<slot name="prepend-outer" :value="value" :disabled="disabled" />
		</div>
		<div class="input" :class="{ disabled, monospace }">
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
import { defineComponent, computed } from '@vue/composition-api';
import slugify from '@sindresorhus/slugify';

export default defineComponent({
	inheritAttrs: false,
	props: {
		autofocus: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		prefix: {
			type: String,
			default: null,
		},
		suffix: {
			type: String,
			default: null,
		},
		monospace: {
			type: Boolean,
			default: false,
		},
		fullWidth: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [String, Number],
			default: null,
		},
		slug: {
			type: Boolean,
			default: false,
		},
		slugSeparator: {
			type: String,
			default: '-',
		},
	},
	setup(props, { emit, listeners }) {
		const _listeners = computed(() => ({
			...listeners,
			input: emitValue,
		}));

		const hasClick = computed(() => {
			return listeners.click !== undefined;
		});

		return { _listeners, hasClick };

		function emitValue(event: InputEvent) {
			let value = (event.target as HTMLInputElement).value;

			if (props.slug === true) {
				value = slugify(value, { separator: props.slugSeparator });
			}

			emit('input', value);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	display: flex;
	align-items: center;
	width: max-content;
	height: var(--input-height);

	.prepend-outer {
		margin-right: 8px;
	}

	.input {
		display: flex;
		flex-grow: 1;
		align-items: center;
		height: 100%;
		padding: var(--input-padding);
		color: var(--foreground-normal);
		background-color: var(--background-page);
		border: var(--border-width) solid var(--border-normal);
		border-radius: var(--border-radius);
		transition: border-color var(--fast) var(--transition);

		.prepend {
			margin-right: 8px;
		}

		&:hover {
			color: var(--foreground-normal);
			background-color: var(--background-page);
			border-color: var(--border-normal-alt);
		}

		&:focus-within {
			color: var(--foreground-normal);
			background-color: var(--background-page);
			border-color: var(--primary);
		}

		&.disabled {
			color: var(--foreground-subdued);
			background-color: var(--background-subdued);
			border-color: var(--border-normal);
		}

		.prefix,
		.suffix {
			color: var(--foreground-subdued);
		}

		.append {
			margin-left: 8px;
		}
	}

	input {
		flex-grow: 1;
		width: 80%; // allows flex to shrink to allow for slots
		height: 100%;
		background-color: transparent;
		border: none;
		appearance: none;

		&::placeholder {
			color: var(--foreground-subdued);
		}
	}

	&.has-click {
		cursor: pointer;
		input {
			pointer-events: none;
		}
	}

	&.active .input {
		color: var(--foreground-normal);
		background-color: var(--background-page);
		border-color: var(--primary);
	}

	.input.monospace {
		input {
			font-family: var(--family-monospace);
		}
	}

	.append-outer {
		margin-left: 8px;
	}

	&.full-width {
		width: 100%;

		.input {
			width: 100%;
		}
	}
}
</style>
