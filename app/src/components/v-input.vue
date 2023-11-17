<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { keyMap, systemKeys } from '@/composables/use-shortcut';
import slugify from '@sindresorhus/slugify';
import { omit } from 'lodash';
import { computed, ref, useAttrs } from 'vue';

interface Props {
	/** Autofocusses the input on render */
	autofocus?: boolean;
	/** Set the disabled state for the input */
	disabled?: boolean;
	/** If the input should be clickable */
	clickable?: boolean;
	/** Prefix the users value with a value */
	prefix?: string;
	/** Show a value at the end of the input */
	suffix?: string;
	/** Render the input with 100% width */
	fullWidth?: boolean;
	/** What text to display if the input is empty */
	placeholder?: string | number;
	/** Used to model the value written inside the input */
	modelValue?: string | number;
	/** When active, sets an empty entry to null */
	nullable?: boolean;
	/** Force the value to be URL safe */
	slug?: boolean;
	/** What character to use as separator in slugs */
	slugSeparator?: string;
	/** Defines the type of the input. Either `text` or `number` */
	type?: string;
	/** Hide the arrows that are used to increase or decrease a number */
	hideArrows?: boolean;
	/** The maximum amount of characters that can be entered */
	maxLength?: number;
	/** The maximum number that can be entered */
	max?: number;
	/** The minimum number that can be entered */
	min?: number;
	/** In which unit steps should be counted up or down */
	step?: number;
	/** Force the focus state */
	active?: boolean;
	/** Make the value save to be used with the DB */
	dbSafe?: boolean;
	/** Trim the start and end whitespace */
	trim?: boolean;
	/** The kind of autocompletion the browser should do on the input */
	autocomplete?: string;
	/** Makes the input smaller */
	small?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	autofocus: false,
	disabled: false,
	clickable: false,
	prefix: undefined,
	suffix: undefined,
	fullWidth: true,
	placeholder: undefined,
	modelValue: undefined,
	nullable: true,
	slug: false,
	slugSeparator: '-',
	type: 'text',
	hideArrows: false,
	max: undefined,
	min: undefined,
	step: 1,
	active: false,
	dbSafe: false,
	trim: false,
	autocomplete: 'off',
	small: false,
});

const emit = defineEmits(['click', 'keydown', 'update:modelValue', 'focus']);

const attrs = useAttrs();

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
		small: props.small,
	},
	...((attrs.class || '') as string).split(' '),
]);

const isStepUpAllowed = computed(() => {
	return props.disabled === false && (props.max === undefined || parseInt(String(props.modelValue), 10) < props.max);
});

const isStepDownAllowed = computed(() => {
	return props.disabled === false && (props.min === undefined || parseInt(String(props.modelValue), 10) > props.min);
});

function processValue(event: KeyboardEvent) {
	if (!event.key) return;
	const key = event.key in keyMap ? keyMap[event.key] : event.key.toLowerCase();
	const value = (event.target as HTMLInputElement).value;

	if (props.slug === true) {
		const slugSafeCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789-_~ '.split('');

		const isAllowed = slugSafeCharacters.includes(key) || systemKeys.includes(key) || key.startsWith('arrow');

		if (isAllowed === false) {
			event.preventDefault();
		}

		if (key === ' ' && value.endsWith(props.slugSeparator)) {
			event.preventDefault();
		}
	}

	if (props.dbSafe === true) {
		const dbSafeCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789_ '.split('');

		const isAllowed = dbSafeCharacters.includes(key) || systemKeys.includes(key) || key.startsWith('arrow');

		if (isAllowed === false) {
			event.preventDefault();
		}

		const isCombinationWithSystemKeys = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

		// Prevent leading number
		if (value.length === 0 && '0123456789'.split('').includes(key) && !isCombinationWithSystemKeys) {
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
		const parsedNumber = Number(value);

		// Ignore if numeric value remains unchanged
		if (props.modelValue !== parsedNumber) {
			emit('update:modelValue', parsedNumber);
		}
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
			// prevent pasting of non dbSafeCharacters from bypassing the keydown checks
			value = value.replace(/[^a-zA-Z0-9_]/g, '');
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
</script>

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
					:placeholder="placeholder ? String(placeholder) : undefined"
					:autocomplete="autocomplete"
					:type="type"
					:maxlength="maxLength"
					:min="min"
					:max="max"
					:step="step"
					:disabled="disabled"
					:value="modelValue === undefined || modelValue === null ? '' : String(modelValue)"
					v-on="listeners"
				/>
			</slot>
			<span v-if="suffix" class="suffix">{{ suffix }}</span>
			<span v-if="type === 'number' && !hideArrows">
				<v-icon
					:class="{ disabled: !isStepUpAllowed }"
					name="keyboard_arrow_up"
					class="step-up"
					tabindex="-1"
					clickable
					:disabled="!isStepUpAllowed"
					@click="stepUp"
				/>
				<v-icon
					:class="{ disabled: !isStepDownAllowed }"
					name="keyboard_arrow_down"
					class="step-down"
					tabindex="-1"
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

<style lang="scss" scoped>
/**
	Available component overrides:

	--v-input-font-family         [--theme--fonts--sans--font-family]
	--v-input-placeholder-color   [--theme--foreground-subdued]
	--v-input-color               [--theme--form--field--input--foreground]
	--v-input-background-color    [--theme--form--field--input--background]
	--v-input-border-color        [--theme--form--field--input--border-color]
	--v-input-border-color-hover  [--theme--form--field--input--border-color-hover]
	--v-input-border-color-focus  [--theme--form--field--input--border-color-focus]
	--v-input-border-radius       [--theme--border-radius]
*/

.v-input {
	--arrow-color: var(--theme--form--field--input--border-color);
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	width: max-content;
	height: var(--theme--form--field--input--height);

	.prepend-outer {
		margin-right: 8px;
	}

	.input {
		position: relative;
		display: flex;
		flex-grow: 1;
		align-items: center;
		height: 100%;
		padding: var(--theme--form--field--input--padding);
		padding-top: 0px;
		padding-bottom: 0px;
		color: var(--v-input-color, var(--theme--form--field--input--foreground));
		font-family: var(--v-input-font-family, var(--theme--fonts--sans--font-family));
		background-color: var(--v-input-background-color, var(--theme--form--field--input--background));
		border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
		border-radius: var(--v-input-border-radius, var(--theme--border-radius));
		transition: var(--fast) var(--transition);
		transition-property: border-color, box-shadow;
		box-shadow: var(--theme--form--field--input--box-shadow);

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
				--arrow-color: var(--theme--primary);
			}

			&:active:not(.disabled) {
				transform: scale(0.9);
			}

			&.disabled {
				--arrow-color: var(--v-input-border-color);

				cursor: auto;
			}
		}

		&:hover {
			--arrow-color: var(--v-input-border-color-hover, var(--theme--form--field--input--border-color-hover));

			color: var(--v-input-color);
			background-color: var(--theme--form--field--input--background);
			border-color: var(--v-input-border-color-hover, var(--theme--form--field--input--border-color-hover));
			box-shadow: var(--theme--form--field--input--box-shadow-hover);
		}

		&:focus-within,
		&.active {
			--arrow-color: var(--v-input-border-color-hover, var(--theme--form--field--input--border-color-hover));

			color: var(--v-input-color);
			background-color: var(--theme--form--field--input--background);
			border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
			box-shadow: var(--theme--form--field--input--box-shadow-focus);
		}

		&.disabled {
			--arrow-color: var(--v-input-border-color);

			color: var(--theme--foreground-subdued);
			background-color: var(--theme--form--field--input--background-subdued);
			border-color: var(--v-input-border-color, var(--theme--form--field--input--border-color));
		}

		.prefix,
		.suffix {
			color: var(--theme--foreground-subdued);
		}

		.append {
			flex-shrink: 0;
			margin-left: 8px;
		}
	}

	input {
		flex-grow: 1;
		width: 20px; /* allows flex to grow/shrink to allow for slots */
		height: 100%;
		padding: var(--theme--form--field--input--padding);
		padding-right: 0px;
		padding-left: 0px;
		font-family: var(--v-input-font-family, var(--theme--fonts--sans--font-family));
		background-color: transparent;
		border: none;
		appearance: none;

		&::placeholder {
			color: var(--v-input-placeholder-color, var(--theme--foreground-subdued));
		}

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			margin: 0;
			appearance: none;
		}

		&:focus {
			border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		}

		/* Firefox */

		&[type='number'] {
			appearance: textfield;
		}
	}

	&.small {
		height: 38px;

		.input {
			padding: 8px 12px;
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
				color: var(--theme--foreground-subdued);
			}
		}

		.append-outer {
			margin-left: 8px;
		}
	}
}
</style>
