<template>
	<div class="v-input" :class="classes" @click="$emit('click', $event)">
		<div v-if="$slots['prepend-outer']" class="prepend-outer">
			<slot name="prepend-outer" :value="modelValue" :disabled="disabled" />
		</div>
		<div class="input" :class="{ disabled, active }">
			<div v-if="$slots.prepend" class="prepend">
				<slot name="prepend" :value="modelValue" :disabled="disabled" />
			</div>
			<span v-if="prefix" class="prefix">{{ prefix }}</span>
			<slot name="input">
				<input
					ref="input"
					v-focus="autofocus"
					v-bind="attributes"
					:placeholder="placeholder"
					:autocomplete="autocomplete"
					:type="type"
					:min="min"
					:max="max"
					:step="step"
					:disabled="disabled"
					:value="modelValue === null ? '' : String(modelValue)"
					v-on="listeners"
				/>
			</slot>
			<span v-if="suffix" class="suffix">{{ suffix }}</span>
			<span v-if="type === 'number' && !hideArrows">
				<v-icon
					:class="{ disabled: !isStepUpAllowed }"
					name="keyboard_arrow_up"
					class="step-up"
					clickable
					:disabled="!isStepUpAllowed"
					@click="stepUp"
				/>
				<v-icon
					:class="{ disabled: !isStepDownAllowed }"
					name="keyboard_arrow_down"
					class="step-down"
					clickable
					:disabled="!isStepDownAllowed"
					@click="stepDown"
				/>
			</span>
			<div v-if="$slots.append" class="append">
				<slot name="append" :value="modelValue" :disabled="disabled" />
			</div>
		</div>
		<div v-if="$slots['append-outer']" class="append-outer">
			<slot name="append-outer" :value="modelValue" :disabled="disabled" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { omit } from 'lodash';
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
		clickable: {
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
		placeholder: {
			type: [String, Number],
			default: null,
		},
		modelValue: {
			type: [String, Number],
			default: null,
		},
		nullable: {
			type: Boolean,
			default: true,
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
		hideArrows: {
			type: Boolean,
			default: false,
		},
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
		trim: {
			type: Boolean,
			default: false,
		},
		autocomplete: {
			type: String,
			default: 'off',
		},
	},
	emits: ['click', 'keydown', 'update:modelValue', 'focus'],
	setup(props, { emit, attrs }) {
		const input = ref<HTMLInputElement | null>(null);

		const listeners = computed(() => ({
			input: emitValue,
			keydown: processValue,
			blur: (e: Event) => {
				trimIfEnabled();
				if (typeof attrs.onBlur === 'function') attrs.onBlur(e);
			},
			focus: (e: PointerEvent) => emit('focus', e),
		}));
		const attributes = computed(() => omit(attrs, ['class']));

		const classes = computed(() => [
			{
				'full-width': props.fullWidth,
				'has-click': props.clickable,
				disabled: props.disabled,
			},
			...((attrs.class || '') as string).split(' '),
		]);

		const isStepUpAllowed = computed(() => {
			return props.disabled === false && (props.max === null || parseInt(String(props.modelValue), 10) < props.max);
		});

		const isStepDownAllowed = computed(() => {
			return props.disabled === false && (props.min === null || parseInt(String(props.modelValue), 10) > props.min);
		});

		return { listeners, attributes, classes, stepUp, stepDown, isStepUpAllowed, isStepDownAllowed, input };

		function processValue(event: KeyboardEvent) {
			if (!event.key) return;
			const key = event.key.toLowerCase();
			const systemKeys = [
				'meta',
				'shift',
				'alt',
				'backspace',
				'tab',
				'arrowup',
				'arrowdown',
				'arrowleft',
				'arrowright',
			];
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

			if (props.dbSafe === true) {
				const dbSafeCharacters = 'abcdefghijklmnopqrstuvwxyz01234567890_ '.split('');

				const isAllowed = dbSafeCharacters.includes(key) || systemKeys.includes(key) || key.startsWith('arrow');

				if (isAllowed === false) {
					event.preventDefault();
				}

				// Prevent leading number
				if (value.length === 0 && '0123456789'.split('').includes(key)) {
					event.preventDefault();
				}
			}

			emit('keydown', event);
		}

		function trimIfEnabled() {
			if (props.modelValue && props.trim && ['string', 'text'].includes(props.type)) {
				emit('update:modelValue', String(props.modelValue).trim());
			}
		}

		function emitValue(event: InputEvent) {
			let value = (event.target as HTMLInputElement).value;

			if (props.nullable === true && value === '') {
				emit('update:modelValue', null);
				return;
			}

			if (props.type === 'number') {
				emit('update:modelValue', Number(value));
			} else {
				if (props.slug === true) {
					const endsWithSpace = value.endsWith(' ');
					value = slugify(value, { separator: props.slugSeparator, preserveTrailingDash: true });
					if (endsWithSpace) value += props.slugSeparator;
				}

				if (props.dbSafe === true) {
					value = value.replace(/\s/g, '_');
					// Replace é -> e etc
					value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
				}

				emit('update:modelValue', value);
			}
		}

		function stepUp() {
			if (!input.value) return;
			if (isStepUpAllowed.value === false) return;

			input.value.stepUp();

			if (input.value.value != null) {
				return emit('update:modelValue', Number(input.value.value));
			}
		}

		function stepDown() {
			if (!input.value) return;
			if (isStepDownAllowed.value === false) return;

			input.value.stepDown();

			if (input.value.value) {
				return emit('update:modelValue', Number(input.value.value));
			} else {
				return emit('update:modelValue', props.min || 0);
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
	--v-input-color: var(--foreground-normal);
	--v-input-background-color: var(--background-input);
	--v-input-border-color-focus: var(--primary);

	display: flex;
	align-items: center;
	width: max-content;
	height: var(--input-height);

	.prepend-outer {
		margin-right: 8px;
	}

	.input {
		position: relative;
		display: flex;
		flex-grow: 1;
		align-items: center;
		height: 100%;
		padding: var(--input-padding);
		padding-top: 0px;
		padding-bottom: 0px;
		color: var(--v-input-color);
		font-family: var(--v-input-font-family);
		background-color: var(--v-input-background-color);
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

			&:hover:not(.disabled) {
				--arrow-color: var(--primary);
			}

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

			color: var(--v-input-color);
			background-color: var(--background-input);
			border-color: var(--border-normal-alt);
		}

		&:focus-within,
		&.active {
			--arrow-color: var(--border-normal-alt);

			color: var(--v-input-color);
			background-color: var(--background-input);
			border-color: var(--v-input-border-color-focus);
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
			flex-shrink: 0;
			margin-left: 8px;
		}
	}

	input {
		flex-grow: 1;
		width: 20px; // allows flex to grow/shrink to allow for slots
		height: 100%;
		padding: var(--input-padding);
		padding-right: 0px;
		padding-left: 0px;
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
			appearance: none;
		}

		&:focus {
			border-color: var(--v-input-border-color-focus);
		}

		/* Firefox */

		&[type='number'] {
			appearance: textfield;
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

		&.disabled {
			cursor: auto;
		}

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
