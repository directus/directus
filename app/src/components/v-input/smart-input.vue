<template>
	<div class="smart-field-root" :focus="focusField">
		<div class="smart-field">
			<div class="highlights">
				<!-- placeholder for highlights -->
			</div>
			<input
				ref="inputField"
				v-model="fieldValue"
				:placeholder="placeholder ? String(placeholder) : undefined"
				type="text"
				:autocomplete="autocomplete"
				:disabled="disabled"
				v-bind="$attrs"
				v-on="listeners"
			/>
		</div>
		<div v-if="isDisplayNum" class="data-warning">
			<v-icon name="error_outline" tabindex="-1" clickable @click="stepUp" />
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
	</div>
</template>

<script lang="ts">
export default {
	name: 'SmartInput',
};
</script>

<script setup lang="ts">
import { computed, nextTick, ref, Ref, watch } from 'vue';
import Big from 'big.js';
import { Field } from '@directus/shared/types';

// Set rounding mode to half-up
Big.RM = 1;

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
	saveAffix: false,
});

const emit = defineEmits(['update:modelValue', 'click', 'keydown', 'keyup', 'input', 'blur', 'focus']);

// const INT_2_MIN = Big('-32768');
// const INT_2_MAX = Big('32767');
const INT_4_MIN = Big('-2147483648');
const INT_4_MAX = Big('2147483647');
const INT_8_MIN = Big('-9223372036854775808');
const INT_8_MAX = Big('9223372036854775807');
const FLOAT_4_MIN = Big('-3.402823e+38');
const FLOAT_4_MAX = Big('3.402823e+38');
// const FLOAT_8_MIN = Big('-1.797693e+308');
// const FLOAT_8_MAX = Big('1.797693e+308');

const inputField: Ref<HTMLInputElement | null> = ref(null);

const fieldDisplayType = ref(props.type || 'text');

/**
 * These are separate from checking props.type. They start synced to props.type,
 * however, fieldDisplayType will change when using a smart text field, depending
 * on the context of the cursor location.
 */
const isDisplayNum = computed(() => fieldDisplayType.value === 'number');
// const isDisplayText = computed(() => fieldDisplayType.value === 'text');

const fieldValue = ref(String(props.modelValue));

/**
 * Keep track of current number. Necessary when text field has more than one
 * editable number.
 */
const workingNumber = ref(props.type === 'number' ? String(props.modelValue) : '');

// Start/end index of working number in string
const workingNumberRange = ref({
	start: 0,
	end: 0,
});

watch(
	() => props.modelValue,
	(newModel) => {
		const value = String(newModel);
		/**
		 * Only update from the model value if the value is *not* equal to
		 * our working number when our field is a number type. (We only
		 * emit valid numbers, field could have extra characters we don't
		 * want overwritten unless it's clear we didn't send the update
		 * from here). Or not equal to the fieldValue when the field
		 * is a text type.
		 */
		if (
			(props.type === 'number' && value !== workingNumber.value) ||
			(props.type === 'text' && value !== fieldValue.value)
		) {
			updateField(value, { overwrite: true });
		}
	}
);
if (props.type === 'text') {
	watch(
		() => fieldValue.value,
		() => {
			if (document.activeElement === inputField.value) {
				setWorkingNumAtCursor();
			}
		}
	);
}

// Supported input types 'bigInteger', 'integer', 'float', 'decimal'
const numberType = computed(() => {
	let fieldType = 'integer';
	if (props.type === 'number' && props.fieldData?.type) {
		fieldType = props.fieldData.type;
	}
	return fieldType;
});

// Return precision if numeric/decimal type, 0 otherwise
const numberPrecision = computed(() => {
	let precision = 0;
	if (numberType.value === 'decimal' && props.type === 'number' && props.fieldData?.schema?.numeric_precision) {
		precision = props.fieldData?.schema?.numeric_precision;
	}
	return Number(precision);
});

// Return scale if numeric/decimal type, 0 otherwise
const numberScale = computed(() => {
	let scale = 0;
	if (numberType.value === 'decimal' && props.type === 'number' && props.fieldData?.schema?.numeric_scale) {
		scale = props.fieldData.schema.numeric_scale;
	}
	return Number(scale);
});

/**
 * For some number types we need to ensure that the step is within the available scale.
 * If it's not, we'll round it to the nearest value the data type can handle.
 *
 * Ideally, we'll restrict the step value in the field editing process, and this should
 * just be a redundant check.
 */
const getStep = computed(() => {
	const step = Big(props.step || '1');
	switch (numberType.value) {
		// Integers can't have decimals
		case 'integer':
		case 'bigInteger':
			return step.round();
		case 'decimal':
			return step.round(numberScale.value);
		case 'float':
		default:
			/**
			 * Float 4 (the float format Directus defaults to) has up to 7 decimal points
			 * of precision, however, it's the absolute max, assuming nothing preceeding
			 * the decimal. We'll just have to round to 7 places and assume the user knows
			 * what they're doing if they're using floats.
			 */
			return step.round(7);
	}
});

// Set min for data types
const getMin = computed(() => {
	if (!props.min) {
		switch (numberType.value) {
			// Int4 limits
			case 'integer':
				return INT_4_MIN;
			// Int8 limits
			case 'bigInteger':
				return INT_8_MIN;
			case 'float':
				return FLOAT_4_MIN;
			default:
				return null;
		}
	} else {
		const min = Big(props.min);
		switch (numberType.value) {
			// Int4 limits
			case 'integer':
				return clamp(min, INT_4_MIN, INT_4_MAX);
			// Int8 limits
			case 'bigInteger':
				return clamp(min, INT_8_MIN, INT_8_MAX);
			case 'float':
				return clamp(min, FLOAT_4_MIN, FLOAT_4_MAX);
			default:
				return min;
		}
	}
});

// Set max for data types
const getMax = computed(() => {
	if (!props.max) {
		switch (numberType.value) {
			// Int4 limits
			case 'integer':
				return INT_4_MAX;
			// Int8 limits
			case 'bigInteger':
				return INT_8_MAX;
			case 'float':
				return FLOAT_4_MAX;
			default:
				return null;
		}
	} else {
		const max = Big(props.max);
		switch (numberType.value) {
			// Int4 limits
			case 'integer':
				return clamp(max, INT_4_MIN, INT_4_MAX);
			// Int8 limits
			case 'bigInteger':
				return clamp(max, INT_8_MIN, INT_8_MAX);
			case 'float':
				return clamp(max, FLOAT_4_MIN, FLOAT_4_MAX);
			default:
				return max;
		}
	}
});

const minCast = ref(getMin.value);
const maxCast = ref(getMax.value);
const stepCast = ref(getStep.value);

/**
 * Given a string such as:
 * -86 plus -0 isn't 1.5 and 3674. 15% of -90 - or .0005 with -.67.8 1e10 then -5E-7 -1.7e-4 + 0.02-4
 * Matches returned are valid input numbers:
 * ['-86', '-0', '1.5', '3674', '15', '-90', '.0005', '-.67', '.8', '1e10', '-5E-7', '-1.7e-4', '0.02', '-4']
 */
const numRegex = new RegExp(/[-]?((\d+\.\d+)|(\d+)|(\.\d+))([eE][+-]?\d+)?/, 'g');

/**
 * Matches similar to numRegex, however, it matches incrementally. For instance, numRegex
 * would only match the `7` in `7e-`, because it's not in proper notation. Though, each
 * part is sequenced in such a way that it *can* be proper scientific notation if it is
 * appended by any digit. Thus, incrementalNumRegex matches `7e-`, and `7e-4`, however
 * would fail on `7e-.`, `7e--`, `7e-e`, `7e-.2`, etc.
 *
 * Note, because each part is optional, may return many null values.
 */
const boundedIncrementalNumRegex = new RegExp(
	/^[-]?(\d*)?((?<!(e[+-]\d))\.(?![e-]))?(\d+)?((?<=\d)(e))?(((?<=e)[+-])?(\d*)?)?$/,
	'i'
);

const canStepUp = computed(() => {
	// Checking !workingNumber without accounting for 0 works because workingNumber
	// is a string and !'0' = false
	return !props.disabled && (!workingNumber.value || !maxCast.value || Big(workingNumber.value).lt(maxCast.value));
});

const canStepDown = computed(() => {
	return !props.disabled && (!workingNumber.value || !minCast.value || Big(workingNumber.value).gt(minCast.value));
});

const listeners = computed(() => ({
	input: onInput,
	beforeinput: onBeforeInput,
	click: onInputClick,
	focus: onInputFocus,
	blur: onInputBlur,
	keydown: onInputKeydown,
	keyup: onInputKeyup,
}));

function stepUp(evt?: MouseEvent | KeyboardEvent) {
	if (canStepUp.value === false) return;
	const valToStep = Big(workingNumber.value || '0');

	const onePlus = valToStep.plus(stepCast.value).toString();

	const withShiftKey = evt ? evt.shiftKey : false;

	const cursor = getCursorPosition();
	updateField(onePlus, { shiftKey: withShiftKey });
	restoreCursorPosition(cursor);
}

function stepDown(evt?: MouseEvent | KeyboardEvent) {
	if (canStepDown.value === false) return;
	const valToStep = Big(workingNumber.value || '0');

	const oneMinus = valToStep.minus(stepCast.value).toString();

	const withShiftKey = evt ? evt.shiftKey : false;

	const cursor = getCursorPosition();
	updateField(oneMinus, { shiftKey: withShiftKey });
	restoreCursorPosition(cursor);
}

/**
 * If narrowed value is/can become a number, return false (i.e. don't restrict).
 * Otherwise return true (restrict)
 */
function restrictToNumber(value: string) {
	// Value is, or can become a number
	const canBeValidNum = boundedIncrementalNumRegex.test(value);

	// Can be valid, don't restrict
	if (canBeValidNum) return false;

	return true;
}

function setWorkingNumAtCursor() {
	if (props.type !== 'text') return;
	if (isNumberAtCursor()) {
		const cursor = getCursorPosition();
		const matchCandidates = fieldValue.value.matchAll(numRegex);
		let matches = [];

		if (cursor.atEnd) {
			cursor.start = fieldValue.value.length;
		}

		for (let match of matchCandidates) {
			if (match[0].length > 0) {
				matches.push({
					match: match[0],
					start: match.index || 0,
					end: (match.index || 0) + match[0].length,
				});
			}
		}

		const numAtCursor = matches.find((match) => {
			if (cursor.start >= match.start && cursor.start <= match.end) return true;
		});

		if (numAtCursor) {
			/**
			 * updateWorkingNumber calls determineEmittable, as a result, the working
			 * number may differ from the contents of the number in the text field.
			 * This is ok, because on a text field we only use the working number
			 * and/or modify the number in the input when an arrow key or button
			 * is pressed (stepUp() or stepDown()). In other words, it won't alter
			 * anything unless explicitly treated as a number.
			 */
			updateWorkingNumber(numAtCursor.match);
			setWorkingNumberRange(numAtCursor?.start, numAtCursor?.end);
			fieldDisplayType.value = 'number';
			return true;
		}
	}
	resetFieldMeta();
}

function resetFieldMeta() {
	if (props.type === 'text') {
		setWorkingNumberRange();
		updateWorkingNumber('');
		fieldDisplayType.value = 'text';
	}
}

/**
 * Acts as a preliminary, low-resource check to see if there's an editable
 * number at the cursor position. Helps to avoid unnecessarily running
 * expensive regex operations.
 */
function isNumberAtCursor() {
	const cursor = getCursorPosition();
	// If there's a range selected, don't engage number editing.
	if (cursor.start !== cursor.end) return false;

	const value = fieldValue.value as string;

	/**
	 * For obvious reasons, getCursorPosition has to check position in DOM field.
	 * If the updated value is shorter than the input field value, and the cursor
	 * was placed in that difference, we'll account for that.
	 */
	if (cursor.atEnd) {
		cursor.start = value.length;
	}

	// Matches exactly one digit
	const regexBefore = new RegExp(/^\d$/);
	// Matches [digit], -[digit], .[digit], or -.[digit]
	const regexAfter = new RegExp(/^((\d.{0,2})|(-\d.?)|(\.\d.?)|(-\.\d))$/);

	const charBefore = value.substring(cursor.start > 0 ? cursor.start - 1 : 0, cursor.start);
	const charsAfter = value.substring(cursor.start, cursor.start + 3);

	if (regexBefore.test(charBefore) || regexAfter.test(charsAfter)) return true;

	return false;
}

function updateWorkingNumber(value: string, exactSteps = false) {
	const emittable = determineEmittable(value, exactSteps);
	if (emittable) {
		workingNumber.value = Big(emittable).toString() || '';
	} else {
		workingNumber.value = '';
	}
}

function setWorkingNumberRange(start = 0, end = 0) {
	workingNumberRange.value.start = start;
	workingNumberRange.value.end = end;
}

interface FieldUpdateOptions {
	overwrite?: boolean;
	shiftKey?: boolean;
}

function updateField(
	value: string,
	options: FieldUpdateOptions = {
		overwrite: false,
		shiftKey: false,
	}
) {
	if (props.type === 'number') {
		updateWorkingNumber(value, !!options.shiftKey);
		fieldValue.value = workingNumber.value;
	}
	if (props.type === 'text') {
		// On text field, if overwrite is set it'll explicitly set the entire field.
		// Otherwise, only the subsection of the working number will be updated
		if (options.overwrite) {
			fieldValue.value = value;
		} else {
			const start = workingNumberRange.value.start;
			const end = workingNumberRange.value.end;

			const newValue = `${fieldValue.value.slice(0, start)}${workingNumber.value}${fieldValue.value.slice(end)}`;

			fieldValue.value = newValue;

			setWorkingNumAtCursor();
		}
	}
	emitUpdateModelValue(fieldValue.value);
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
		numAtStep = clampedNum;
	}

	if (numberPrecision.value && numberPrecision.value > 0) {
		numAtStep = numAtStep.prec(numberPrecision.value);
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
function clamp(num: Big, min: Big | null, max: Big | null): Big {
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
	return Big('0');
}

function minBig(a: Big, b: Big): Big {
	return a.lt(b) ? a : b;
}

function maxBig(a: Big, b: Big): Big {
	return a.gt(b) ? a : b;
}

function checkKeydownAction(evt: KeyboardEvent) {
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
	}
}

function checkKeyupAction(evt: KeyboardEvent) {
	const key = evt.code;
	if (props.type === 'text' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
		setWorkingNumAtCursor();
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
	const start = input?.selectionStart || input?.selectionStart == 0 ? input?.selectionStart : input?.value.length || 0;
	const end = input?.selectionEnd || input?.selectionEnd == 0 ? input?.selectionEnd : input?.value.length || 0;

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

// Called when .focus() is called on root element
function focusField() {
	inputField?.value?.focus();
}

/** Emits */

function emitUpdateModelValue(value: string) {
	emit('update:modelValue', value);
}

function emitInput(evt: InputEvent) {
	emit('input', evt);
}

function emitFocus(evt: FocusEvent) {
	emit('focus', evt);
}
function emitBlur(evt: FocusEvent) {
	emit('blur', evt);
}
function emitClick(evt: MouseEvent) {
	emit('click', evt);
}
function emitKeydown(evt: KeyboardEvent) {
	emit('keydown', evt);
}
function emitKeyup(evt: KeyboardEvent) {
	emit('keyup', evt);
}

/** Event listener callbacks */

function onInput(evt: InputEvent) {
	emitInput(evt);
}

function onBeforeInput(evt: InputEvent) {
	let nextValue: string | number = getNextValue(evt) || '';

	let shouldRestrict = false;

	// Only need to restrict input if number
	if (props.type === 'number') {
		// Restrict to number-like values
		shouldRestrict = restrictToNumber(nextValue);
		if (shouldRestrict) {
			evt.preventDefault();
		}
	}
}

function onInputFocus(evt: FocusEvent) {
	emitFocus(evt);
	if (evt.defaultPrevented) return;
	setWorkingNumAtCursor();
}

function onInputBlur(evt: FocusEvent) {
	emitBlur(evt);
	if (evt.defaultPrevented) return;
	resetFieldMeta();
}

function onInputClick(evt: MouseEvent) {
	emitClick(evt);
	if (evt.defaultPrevented) return;
	setWorkingNumAtCursor();
}

function onInputKeydown(evt: KeyboardEvent) {
	emitKeydown(evt);
	if (evt.defaultPrevented) return;
	checkKeydownAction(evt);
}

function onInputKeyup(evt: KeyboardEvent) {
	emitKeyup(evt);
	if (evt.defaultPrevented) return;
	checkKeyupAction(evt);
}
</script>

<style scoped lang="scss">
.smart-field-root {
	flex-grow: 1;
	width: 20px;
	height: 100%;
	position: relative;
	display: flex;
	align-items: center;
	height: 100%;
}
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

.data-warning {
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
</style>
