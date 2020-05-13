<template>
	<div
		class="v-input"
		@click="$emit('click', $event)"
		:class="{ 'full-width': fullWidth, 'has-click': hasClick }"
	>
		<div v-if="$slots['prepend-outer']" class="prepend-outer">
			<slot name="prepend-outer" :value="value" :disabled="disabled" />
		</div>
		<div class="input" :class="{ disabled, active }">
			<div v-if="$slots.prepend" class="prepend">
				<slot name="prepend" :value="value" :disabled="disabled" />
			</div>
			<span v-if="prefix" class="prefix">{{ prefix }}</span>
			<slot name="input">
				<input
					v-bind="$attrs"
					v-focus="autofocus"
					v-on="_listeners"
					:type="type"
					:min="min"
					:max="max"
					:step="step"
					:disabled="disabled"
					:value="value"
					ref="input"
				/>
			</slot>
			<span v-if="suffix" class="suffix">{{ suffix }}</span>
			<span v-if="(type === 'number')">
				<v-icon
					:class="{ disabled: value >= max }"
					name="keyboard_arrow_up"
					class="step-up"
					@click="stepUp"
					:disabled="disabled"
				/>
				<v-icon
					:class="{ disabled: value <= min }"
					name="keyboard_arrow_down"
					class="step-down"
					@click="stepDown"
					:disabled="disabled"
				/>
			</span>
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
import { defineComponent, computed, ref } from '@vue/composition-api';
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
		fullWidth: {
			type: Boolean,
			default: true,
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
		type: {
			type: String,
			default: 'text',
		},
		// For number inputs only
		max: {
			type: Number,
			default: null,
		},
		min: {
			type: Number,
			default: null,
		},
		step: {
			type: Number,
			default: 1,
		},
		active: {
			type: Boolean,
			default: false,
		},
		dbSafe: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit, listeners }) {
		const input = ref<HTMLInputElement>(null);

		const _listeners = computed(() => ({
			...listeners,
			input: emitValue,
			keydown: processValue,
		}));

		const hasClick = computed(() => {
			return listeners.click !== undefined;
		});

		return { _listeners, hasClick, stepUp, stepDown, input };

		function processValue(event: KeyboardEvent) {
			const key = event.key.toLowerCase();
			const systemKeys = ['meta', 'shift', 'alt', 'backspace', 'tab'];
			const value = (event.target as HTMLInputElement).value;

			if (props.slug === true) {
				const slugSafeCharacters = 'abcdefghijklmnopqrstuvwxyz01234567890-_~ '.split('');

				const isAllowed = slugSafeCharacters.includes(key) || systemKeys.includes(key);

				if (isAllowed === false) {
					event.preventDefault();
				}

				if (key === ' ' && value.endsWith(props.slugSeparator)) {
					event.preventDefault();
				}
			}

			if (props.slug === true) {
				const dbSafeCharacters = 'abcdefghijklmnopqrstuvwxyz01234567890-_~ '.split('');

				const isAllowed = dbSafeCharacters.includes(key) || systemKeys.includes(key);

				if (isAllowed === false) {
					event.preventDefault();
				}

				// Prevent leading number
				if (value.length === 0 && '0123456789'.split('').includes(key)) {
					event.preventDefault();
				}
			}
		}

		function emitValue(event: InputEvent) {
			let value = (event.target as HTMLInputElement).value;

			if (props.slug === true) {
				const endsWithSpace = value.endsWith(' ');
				value = slugify(value, { separator: props.slugSeparator });
				if (endsWithSpace) value += props.slugSeparator;
			}

			if (props.dbSafe === true) {
				value = value.toLowerCase();
				value = value.replace(/\s/g, '_');
				// Replace é -> e etc
				value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
			}

			emit('input', value);
		}

		function stepUp() {
			if (!input.value) return;
			if (props.disabled === true) return;

			if (props.value < props.max) {
				input.value.stepUp();
				emit('input', input.value.value ?? props.min ?? 0);
			}
		}

		function stepDown() {
			if (!input.value) return;
			if (props.disabled === true) return;

			if (props.value > props.min) {
				input.value.stepDown();
				emit('input', input.value.value);
			}
		}
	},
});
</script>

<style>
body {
	--v-input-font-family: var(--family-sans-serif);
	--v-input-placeholder-color: var(--foreground-subdued);
}
</style>

<style lang="scss" scoped>
.v-input {
	--arrow-color: var(--border-normal);
	--v-icon-color: var(--foreground-subdued);

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
		font-family: var(--v-input-font-family);
		background-color: var(--background-page);
		border: var(--border-width) solid var(--border-normal);
		border-radius: var(--border-radius);
		transition: border-color var(--fast) var(--transition);

		.prepend {
			margin-right: 8px;
		}

		.step-up {
			margin-bottom: -8px;
		}

		.step-down {
			margin-top: -8px;
		}

		.step-up,
		.step-down {
			--v-icon-color: var(--arrow-color);

			display: block;

			&:active:not(.disabled) {
				transform: scale(0.9);
			}

			&.disabled {
				--arrow-color: var(--border-normal);

				cursor: auto;
			}
		}

		&:hover {
			--arrow-color: var(--border-normal-alt);

			color: var(--foreground-normal);
			background-color: var(--background-page);
			border-color: var(--border-normal-alt);
		}

		&:focus-within,
		&.active {
			--arrow-color: var(--primary);

			color: var(--foreground-normal);
			background-color: var(--background-page);
			border-color: var(--primary);
		}

		&.disabled {
			--arrow-color: var(--border-normal);

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
		width: 20px; // allows flex to grow/shrink to allow for slots
		height: 100%;
		font-family: var(--v-input-font-family);
		background-color: transparent;
		border: none;
		appearance: none;

		&::placeholder {
			color: var(--v-input-placeholder-color);
		}

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			margin: 0;
			-webkit-appearance: none;
		}

		/* Firefox */
		&[type='number'] {
			-moz-appearance: textfield;
		}
	}

	&.full-width {
		width: 100%;

		.input {
			width: 100%;
		}
	}

	&.has-click {
		cursor: pointer;
		input {
			pointer-events: none;
			.prefix,
			.suffix {
				color: var(--foreground-subdued);
			}
		}

		.append-outer {
			margin-left: 8px;
		}
	}
}
</style>
