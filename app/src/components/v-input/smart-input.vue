<template>
	<div class="smart-field">
		<div class="highlights">
			<!-- placeholder for highlights -->
		</div>
		<input
			ref="inputField"
			v-model="fieldValue"
			:placeholder="placeholder ? String(placeholder) : undefined"
			type="text"
			@beforeinput="parseInput($event as InputEvent)"
			@keydown="checkKeyAction"
		/>
	</div>
	<div v-if="!hideArrows && isDisplayNum" class="adjustment-arrows">
		<v-icon
			:class="['step-up', { disabled: !canStepUp }]"
			name="keyboard_arrow_up"
			tabindex="-1"
			clickable
			:disabled="!canStepUp"
			@click="stepUp"
		/>
		<v-icon
			:class="['step-down', { disabled: !canStepDown }]"
			name="keyboard_arrow_down"
			tabindex="-1"
			clickable
			:disabled="!canStepDown"
			@click="stepDown"
		/>
	</div>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { computed, nextTick, ref, Ref, watch } from 'vue';
import Big from 'big.js';
import { Field } from '@directus/shared/types';

interface Props {
	autofocus?: boolean;
	disabled?: boolean;
	clickable?: boolean;
	prefix?: string;
	suffix?: string;
	fullWidth?: boolean;
	placeholder?: string;
	modelValue?: string | number;
	nullable?: boolean;
	slug?: boolean;
	slugSeparator?: string;
	type?: string;
	fieldData?: Field;
	hideArrows?: boolean;
	max?: string;
	min?: string;
	step?: string;
	active?: boolean;
	dbSafe?: boolean;
	trim?: boolean;
	autocomplete?: string;
	small?: boolean;
	editAsNumber?: boolean;
	saveAffix?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	autofocus: false,
	disabled: false,
	clickable: false,
	prefix: undefined,
	suffix: undefined,
	fullWidth: true,
	placeholder: '',
	modelValue: '',
	nullable: true,
	slug: false,
	slugSeparator: '-',
	type: 'text',
	fieldData: undefined,
	hideArrows: false,
	max: undefined,
	min: undefined,
	step: '1',
	active: false,
	dbSafe: false,
	trim: false,
	autocomplete: 'off',
	small: false,
	editAsNumber: false,
	saveAffix: false,
});

const emit = defineEmits(['click', 'keydown', 'update:modelValue', 'focus']);

const inputField: Ref<HTMLInputElement | null> = ref(null);

const fieldDisplayType = ref(props.type || 'text');

/**
 * These are separate from checking props.type. They start synced to props.type,
 * however, fieldDisplayType will change when using a smart text field, depending
 * on the context of the cursor location.
 */
const isDisplayNum = computed(() => fieldDisplayType.value === 'number');
const isDisplayText = computed(() => fieldDisplayType.value === 'text');

const minCast = ref(props.min ? Big(props.min) : null);
const maxCast = ref(props.max ? Big(props.max) : null);
const stepCast = ref(Big(props.step || 1));

const fieldValue = ref(props.modelValue);

const initialValue: Ref<string | number | null> = ref(null);

/**
 * Keep track of current number. Necessary when text field has more than one
 * editable number.
 */
const workingNumber = ref(props.type === 'number' ? String(props.modelValue) : '');

watch(
	() => props.modelValue,
	(newModel) => {
		const display = fieldValue.value;
		const value = String(newModel);
		/**
		 * Only update from the model value if the field isn't set, or if
		 * the value is *not* equal to our working number when our field is a
		 * number type. (We only emit valid numbers, field could have extra
		 * characters we don't want overwritten unless it's clear we didn't
		 * send the update from here)
		 */
		if (!display || (props.type === 'number' && newModel !== workingNumber.value)) {
			updateField(value);
			updateWorkingNumber(value);
		}

		// On first update of model value we'll treat value as initial
		if (initialValue.value === null || initialValue.value === undefined) {
			initialValue.value = newModel;
		}
	}
);

// Supported input types 'bigInteger', 'integer', 'float', 'decimal'
const numberType = computed(() => {
	let fieldType = 'integer';
	if (isDisplayNum.value && props.fieldData?.type) {
		fieldType = props.fieldData.type;
	}
	if (isDisplayText.value && props.fieldData?.meta?.options?.number_type) {
		fieldType = props.fieldData.meta.options.number_type;
	}
	return fieldType;
});

// Return precision if numeric/decimal type, 0 otherwise
const numberPrecision = computed(() => {
	let precision = 0;
	if (numberType.value === 'decimal') {
		if (isDisplayNum.value && props.fieldData?.schema?.numeric_precision) {
			precision = props.fieldData?.schema?.numeric_precision;
		}
		if (isDisplayText.value && props.fieldData?.meta?.options?.numeric_precision) {
			precision = props.fieldData?.meta?.options?.numeric_precision;
		}
	}
	return precision;
});

// Return scale if numeric/decimal type, 0 otherwise
const numberScale = computed(() => {
	let scale = 0;
	if (numberType.value === 'decimal') {
		if (isDisplayNum.value && props.fieldData?.schema?.numeric_scale) {
			scale = props.fieldData?.schema?.numeric_scale;
		}
		if (isDisplayText.value && props.fieldData?.meta?.options?.numeric_scale) {
			scale = props.fieldData?.meta?.options?.numeric_scale;
		}
	}
	return scale;
});

/**
 * Given a string such as:
 * -86 plus -0 isn't 1.5 and 3674. 15% of -90 - or .0005 with -.67.8 1e10 then -5E-7 -1.7e-4 + 0.02-4
 * Matches returned are valid input numbers:
 * ['-86', '-0', '1.5', '3674', '15', '-90', '.0005', '-.67', '.8', '1e10', '-5E-7', '-1.7e-4', '0.02', '-4']
 */
const numRegex = new RegExp(/[+-]?((\d+\.\d+)|(\d+)|(\.\d+))([eE][+-]?\d+)?/, 'g');
const boundedNumRegex = new RegExp(/^[+-]?((\d+\.\d+)|(\d+)|(\.\d+))([eE][+-]?\d+)?$/);

/**
 * Matches similar to numRegex, however, it matches incrementally. For instance, numRegex
 * would only match the `7` in `7e-`, because it's not in proper notation. Though, each
 * part is sequenced in such a way that it *can* be proper scientific notation if it is
 * appended by any digit. Thus, incrementalNumRegex matches `7e-`, and `7e-4`, however
 * would fail on `7e-.`, `7e--`, `7e-e`, `7e-.2`, etc.
 *
 * Note, because each part is optional, may return many null values.
 */
const incrementalNumRegex = new RegExp(
	/((?<![\d+-])[+-])?(\d*)?((?<!(e[+-]\d))\.(?!e))?(\d+)?((?<=\d)(e))?(((?<=e)[+-])?(\d*)?)?/,
	'gi'
);
const boundedIncrementalNumRegex = new RegExp(
	/^((?<![\d+-])[+-])?(\d*)?((?<!(e[+-]\d))\.(?!e))?(\d+)?((?<=\d)(e))?(((?<=e)[+-])?(\d*)?)?$/
);

const canStepUp = computed(() => {
	// Checking !workingNumber without accounting for 0 works because workingNumber
	// is a string and !'0' = false
	return !props.disabled && (!workingNumber.value || !maxCast.value || Big(workingNumber.value).lt(maxCast.value));
});

const canStepDown = computed(() => {
	return !props.disabled && (!workingNumber.value || !minCast.value || Big(workingNumber.value).gt(minCast.value));
});

function stepUp(evt?: MouseEvent | KeyboardEvent) {
	if (canStepUp.value === false) return;
	const valToStep = Big(workingNumber.value || '0');

	const onePlus = valToStep.plus(stepCast.value).toString();

	const withShiftKey = evt ? evt.shiftKey : false;

	updateWorkingNumber(onePlus, withShiftKey);

	const cursor = getCursorPosition();
	updateField(workingNumber.value);
	restoreCursorPosition(cursor);
	emitUp();
}

function stepDown(evt?: MouseEvent | KeyboardEvent) {
	if (canStepDown.value === false) return;
	const valToStep = Big(workingNumber.value || '0');

	const oneMinus = valToStep.minus(stepCast.value).toString();

	const withShiftKey = evt ? evt.shiftKey : false;

	updateWorkingNumber(oneMinus, withShiftKey);

	const cursor = getCursorPosition();
	updateField(workingNumber.value);
	restoreCursorPosition(cursor);
	emitUp();
}

/**
 * If narrowed value is/can become a number, return narrowed value.
 * Otherwise return old value.
 */
function restrictToNumber(value: string) {
	// Value is, or can become a number
	const canBeValidNum = boundedIncrementalNumRegex.test(value);

	// Can be valid, don't restrict
	if (canBeValidNum) return false;

	return true;
}

function parseInput(evt: InputEvent) {
	if (props.type === 'number') {
		const nextValue = getNextValue(evt) || '';
		// Restrict to number-like values
		const restrictInput = restrictToNumber(nextValue);
		if (restrictInput) {
			evt.preventDefault();
		} else {
			updateWorkingNumber(nextValue);
			// Dont need to call updateField because that's taken care of by the
			// v-model during the input event.
			emitUp();
		}
	} else {
		///
	}
}

function updateWorkingNumber(value: string, exactSteps = false) {
	const emittable = determineEmittable(value, exactSteps);
	if (emittable) {
		workingNumber.value = Big(emittable).toString() || '';
	} else {
		workingNumber.value = '';
	}
}

function updateField(value: string) {
	fieldValue.value = value;
}

function emitUp() {
	if (props.type === 'number') {
		let toEmit: string | number = workingNumber.value;
		// If initial value was number and current value is string representation of that number,
		// emit initial value. This will avoid breaking edits tracking.
		if (typeof initialValue.value === 'number' && String(initialValue.value) === workingNumber.value) {
			toEmit = initialValue.value;
		}

		emit('update:modelValue', toEmit);
	}
	if (props.type === 'text' && !(fieldValue.value === props.modelValue)) {
		emit('update:modelValue', fieldValue.value);
	}
}

/**
 * We can't handle input after the input event without having to deal with a bunch
 * of issues, so we instead use beforeInput. As a result, here we are forming the
 * new value based on the input (key press, paste, delete, etc).
 */
function getNextValue(evt: InputEvent) {
	const method = evt.inputType;
	const input = inputField.value!;
	const curValue = input.value;
	const cursorStart = input.selectionStart ?? curValue.length;
	const cursorEnd = input.selectionEnd ?? cursorStart;
	const inserted = evt.data;
	let nextVal = '';

	if (method === 'deleteContentForward' && cursorStart === cursorEnd) {
		nextVal = `${curValue.substring(0, cursorStart)}${curValue.substring(cursorEnd + 1)}`;
	} else if (method === 'deleteContentBackward' && cursorStart === cursorEnd) {
		nextVal = `${curValue.substring(0, cursorStart - 1 > 0 ? cursorStart - 1 : 0)}${curValue.substring(cursorEnd)}`;
	} else {
		nextVal = `${curValue.substring(0, cursorStart)}${inserted ?? ''}${curValue.substring(cursorEnd)}`;
	}
	return nextVal;
}

/**
 * Some values are invalid, but have the potential to become numbers.
 * For instance `7e-` is not a number, but if we add another digit,
 * i.e. `7e-4`, it becomes a valid notation. As a result, our input
 * may not line up with what is emittable.
 *
 * With determineEmittable we'll pull the first valid number, and
 * apply our min and max constraints.
 */
function determineEmittable(value = '', exactSteps: boolean) {
	const min = minCast.value;
	const max = maxCast.value;

	const validNumber = getFirstMatch(value, numRegex);
	if (!validNumber) return false;

	let numAtStep = Big(validNumber);
	if (exactSteps) {
		numAtStep = roundToStep(numAtStep);
	}

	if (min || max) {
		const clampedNum = clamp(numAtStep || Big(validNumber), min, max);
		return clampedNum!.toString();
	}

	return numAtStep.toString();
}

function roundToStep(value: Big) {
	const step = stepCast.value;

	const rounded = value.div(step).round().times(step);

	return rounded;
}

/**
 * Despite the abundant availability of clamp functions (i.e. from Lodash),
 * we have to create our own here in order to handle the possibility of
 * numbers that exceed the base float8 capabilities of javascript.
 *
 * This clamp function takes instances of Big numbers, and clamps them.
 */
function clamp(num: Big, min: Big | null, max: Big | null) {
	if (min && max) {
		// clamp value
		return maxBig(min, minBig(num, max));
	}
	if (min) {
		// return num or min, whichever is higher
		return num.lt(min) ? min : num;
	}
	if (max) {
		// return num or max, whichever is lower
		return num.gt(max) ? max : num;
	}
}

function minBig(a: Big, b: Big) {
	return a.lt(b) ? a : b;
}

function maxBig(a: Big, b: Big) {
	return a.gt(b) ? a : b;
}

function checkKeyAction(evt: KeyboardEvent) {
	const key = evt.code;

	if (isDisplayNum.value && ['ArrowUp', 'ArrowDown'].includes(key)) {
		evt.preventDefault();
		switch (key) {
			case 'ArrowUp':
				stepUp(evt);
				break;
			case 'ArrowDown':
				stepDown(evt);
				break;
		}
	} else if (isDisplayText.value) {
		// else
	}
}

interface CursorPosition {
	start: number;
	end: number;
	atEnd: boolean;
}

function getCursorPosition(): CursorPosition {
	const input = inputField.value;
	const length = input?.value.length;
	const start = input?.selectionStart || input?.value.length || 0;
	const end = input?.selectionEnd || input?.value.length || 0;

	let atEnd = false;
	if (start === length && end === length) {
		atEnd = true;
	}

	return {
		start,
		end,
		atEnd,
	};
}

async function restoreCursorPosition(pos: CursorPosition) {
	// Allow DOM to update before trying to fetch input value
	await nextTick();

	const input = inputField.value;
	const length = input?.value.length || 0;

	setTimeout(() => {
		input?.focus();
		// Keep cursor at end of input if that's where it started
		if (pos.atEnd) {
			input?.setSelectionRange(length, length);
		} else {
			input?.setSelectionRange(pos.start, pos.end);
		}
	}, 0);
}

// Run regex on string, find first value that's not null/empty.
function getFirstMatch(string: string, regex: RegExp) {
	const match = (string.match(regex) || []).find((match) => match.length > 0);
	if (match) return match;
	return '';
}

/**
 * TODO:
 * Get number field schema types
 * > then clamp min/max to min/max of type in database
 * > then restrict step to precision of type
 */
</script>

<style scoped lang="scss">
.smart-field {
	flex-grow: 1;
	width: 20px;
	height: 100%;
	position: relative;
	.highlights,
	input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: var(--input-padding);
		padding-right: 0px;
		padding-left: 0px;
		font-family: var(--v-input-font-family);
		background-color: transparent;
		border: none;
	}
	input {
		appearance: none;

		&::placeholder {
			color: var(--v-input-placeholder-color);
		}

		&:focus {
			border-color: var(--v-input-border-color-focus);
		}
	}
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
</style>
