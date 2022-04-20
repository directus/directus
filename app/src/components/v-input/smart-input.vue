<template>
	<div class="smart-input" :focus="focusField">
		<input
			ref="inputField"
			v-model="fieldValue"
			:placeholder="placeholder ? String(placeholder) : undefined"
			type="text"
			:autocomplete="autocomplete"
			:disabled="disabled"
			:spellcheck="spellcheck"
			v-bind="$attrs"
			v-on="listeners"
		/>
		<div v-if="type === 'number' && !hideDataWarnings && dataWarning && dataWarningMessage" class="data-warning">
			<v-icon
				v-tooltip.instant="dataWarningMessage"
				name="error_outline"
				tabindex="-1"
				clickable
				@mousedown.prevent.stop="roundToSafeValue"
			/>
		</div>
		<div v-if="!hideArrows && isDisplayNum" class="adjustment-arrows">
			<v-icon
				:class="['step-up', { disabled: !canStepUp }]"
				name="keyboard_arrow_up"
				tabindex="-1"
				clickable
				:disabled="!canStepUp"
				@mousedown.prevent.stop="stepUp"
			/>
			<v-icon
				:class="['step-down', { disabled: !canStepDown }]"
				name="keyboard_arrow_down"
				tabindex="-1"
				clickable
				:disabled="!canStepDown"
				@mousedown.prevent.stop="stepDown"
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
import { computed, nextTick, onMounted, onUnmounted, ref, Ref, watch } from 'vue';
import Big from 'big.js';
import { Field } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Set rounding mode to half-up
Big.RM = 1;

interface Props {
	disabled?: boolean;
	prefix?: string;
	suffix?: string;
	placeholder?: string;
	modelValue?: string | number;
	nullable?: boolean;
	type?: string;
	fieldData?: Field;
	hideArrows?: boolean;
	hideDataWarnings?: boolean;
	spellcheck?: boolean;
	max?: string;
	min?: string;
	step?: string;
	autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	prefix: undefined,
	suffix: undefined,
	placeholder: '',
	modelValue: '',
	nullable: true,
	type: 'text',
	fieldData: undefined,
	hideArrows: false,
	hideDataWarnings: false,
	spellcheck: false,
	max: undefined,
	min: undefined,
	step: '1',
	autocomplete: 'off',
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

const isShiftDown = ref(false);

onMounted(() => {
	window.addEventListener('keydown', globalKeydownAction);
	window.addEventListener('keyup', globalKeyupAction);
});
onUnmounted(() => {
	window.removeEventListener('keydown', globalKeydownAction);
	window.removeEventListener('keyup', globalKeyupAction);
});

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

// Supported input types 'bigInteger', 'integer', 'float', 'decimal'
const numberType = computed(() => {
	let fieldType = 'integer';
	if (props.fieldData?.type) {
		fieldType = props.fieldData.type;
	}
	return fieldType;
});

// Return precision if numeric/decimal type, 0 otherwise
const numberPrecision = computed(() => {
	let precision = 0;
	if (numberType.value === 'decimal' && props.fieldData?.schema?.numeric_precision) {
		precision = props.fieldData?.schema?.numeric_precision;
	}
	return Number(precision);
});

// Return scale if numeric/decimal type, 0 otherwise
const numberScale = computed(() => {
	let scale = 0;
	if (numberType.value === 'decimal' && props.fieldData?.schema?.numeric_scale) {
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
	// Force numbers in text inputs to only move in increments of 1
	if (props.type === 'text') return Big('1');
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
			 * Floats don't have even or minimum steps. We'll just use the user-defined
			 * step, or 1.
			 */
			return step;
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
			case 'decimal':
				return getNumericLimit(numberPrecision.value, numberScale.value, true);
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
			case 'decimal':
				return clamp(
					min,
					getNumericLimit(numberPrecision.value, numberScale.value, true),
					getNumericLimit(numberPrecision.value, numberScale.value)
				);
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
			case 'decimal':
				return getNumericLimit(numberPrecision.value, numberScale.value);
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
			case 'decimal':
				return clamp(
					max,
					getNumericLimit(numberPrecision.value, numberScale.value, true),
					getNumericLimit(numberPrecision.value, numberScale.value)
				);
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
	if (props.type === 'text') {
		return !props.disabled && workingNumber.value && Big(workingNumber.value).lt(INT_8_MAX);
	}
	// Checking !workingNumber without accounting for 0 works because workingNumber
	// is a string and !'0' = false
	return !props.disabled && (!workingNumber.value || !maxCast.value || Big(workingNumber.value).lt(maxCast.value));
});

const canStepDown = computed(() => {
	if (props.type === 'text') {
		return !props.disabled && workingNumber.value && Big(workingNumber.value).gt(Big('0'));
	}
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

const dataWarning = computed(() => {
	const numToValidate = getNumberFromValue(fieldValue.value);
	if (!numToValidate) return false;
	const val = Big(numToValidate);

	// Check upper bound
	if (maxCast.value) {
		const max = maxCast.value;
		if (val.gt(max)) {
			if (props.max) return 'over_max';
			return 'out_of_bounds';
		}
	}

	// Check lower bound
	if (minCast.value) {
		const min = minCast.value;
		if (val.lt(min)) {
			if (props.min) return 'under_min';
			return 'out_of_bounds';
		}
	}

	switch (numberType.value) {
		case 'integer':
			return checkInt(val);
		case 'bigInteger':
			return checkBigInt(val);
		case 'decimal':
			return checkNumeric(val);
		case 'float':
			return checkFloat(val);
	}

	return false;
});

const literalDataType = computed(() => {
	const p = numberPrecision.value;
	const s = numberScale.value;
	switch (numberType.value) {
		case 'float':
			return 'float4';
		case 'decimal':
			return `decimal${(p || s) && '('}${p && p}${s && ', ' + s}${(p || s) && ')'}`;
		case 'bigInteger':
			return 'int8';
		case 'integer':
		default:
			return 'int4';
	}
});

const dataWarningMessage = computed(() => {
	const outOfBounds = t('interfaces.input.out_of_data_type_bounds', { data_type: literalDataType.value });
	const exceedsMax = t('interfaces.input.value_over_max', { max: props.max });
	const exceedsMin = t('interfaces.input.value_under_min', { min: props.min });
	const noDecimal = t('interfaces.input.no_decimal', { data_type: literalDataType.value });
	const exceedsScale = t('interfaces.input.exceeds_scale', {
		scale: numberScale.value,
		data_type: literalDataType.value,
	});
	const float4Precision = t('interfaces.input.float_4_precision');
	if (dataWarning.value) {
		switch (dataWarning.value) {
			case 'out_of_bounds':
				return outOfBounds;
			case 'over_max':
				return exceedsMax;
			case 'under_min':
				return exceedsMin;
			case 'decimal_not_supported':
				return noDecimal;
			case 'too_many_decimals':
				return exceedsScale;
			case 'precision_uncertain':
				return float4Precision;
		}
	}
	return false;
});

function roundToSafeValue() {
	switch (dataWarning.value) {
		case 'out_of_bounds':
			updateField(determineEmittable(fieldValue.value));
			break;
		case 'over_max':
			updateField(determineEmittable(fieldValue.value));
			break;
		case 'under_min':
			updateField(determineEmittable(fieldValue.value));
			break;
		case 'decimal_not_supported':
			updateField(
				determineEmittable(
					Big(fieldValue.value || 0)
						.round()
						.toString()
				)
			);
			break;
		case 'too_many_decimals':
			updateField(
				determineEmittable(
					Big(fieldValue.value || 0)
						.round(numberScale.value)
						.toString()
				)
			);
			break;
		case 'precision_uncertain':
			// Do nothing
			break;
	}
}

function getDecimalPlaces(value: Big): number {
	const digits = value.c.length;
	const decimalPlaces = digits - (value.e + 1);
	return decimalPlaces;
}

function checkInt(value: Big) {
	if (getDecimalPlaces(value) > 0) {
		return 'decimal_not_supported';
	}
	return false;
}

function checkBigInt(value: Big) {
	return checkInt(value);
}

function checkNumeric(value: Big) {
	if (getDecimalPlaces(value) > numberScale.value) {
		return 'too_many_decimals';
	}
	return false;
}
function checkFloat(value: Big) {
	if (value.c.length > 7) {
		return 'precision_uncertain';
	}
	return false;
}

function getNumericLimit(percision: number, scale: number, negative?: boolean) {
	const upperBound = Big(`1e${percision - scale}`);
	const step = Big(`1e-${scale}`);
	const limit = upperBound.minus(step);
	if (negative) {
		limit.s = -1;
	}
	return limit;
}

function stepUp() {
	if (canStepUp.value === false) return;
	const valToStep = Big(workingNumber.value || '0');

	const onePlus = determineEmittable(valToStep.plus(stepCast.value).toString());

	const cursor = getCursorPosition();
	updateField(onePlus);
	restoreCursorPosition(cursor);
}

function stepDown() {
	if (canStepDown.value === false) return;
	const valToStep = Big(workingNumber.value || '0');

	const oneMinus = determineEmittable(valToStep.minus(stepCast.value).toString());

	const cursor = getCursorPosition();
	updateField(oneMinus);
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

		// For text inputs we'll only deal with whole, positive integers
		const intRegex = new RegExp(/\d+/, 'g');

		const matchCandidates = fieldValue.value.matchAll(intRegex);
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

	const charBefore = value.substring(cursor.start > 0 ? cursor.start - 1 : 0, cursor.start).trim();
	const charAfter = value.substring(cursor.start, cursor.start + 1).trim();

	// @ts-expect-error
	if ((charBefore.length > 0 && !isNaN(charBefore)) || (charAfter.length > 0 && !isNaN(charAfter))) return true;

	return false;
}

function updateWorkingNumber(value: string) {
	const emittable = determineEmittable(value);
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
}

function updateField(value: string | false, options: FieldUpdateOptions = { overwrite: false }) {
	if (!value) value = '';
	if (props.type === 'number') {
		fieldValue.value = value;
	}
	if (props.type === 'text') {
		// On text field, if overwrite is set it'll explicitly set the entire field.
		// Otherwise, only the subsection of the working number will be updated
		if (options.overwrite) {
			fieldValue.value = value;
		} else {
			const start = workingNumberRange.value.start;
			const end = workingNumberRange.value.end;

			const newValue = `${fieldValue.value.slice(0, start)}${value}${fieldValue.value.slice(end)}`;

			fieldValue.value = newValue;
		}
	}
	afterFieldUpdate();
}

function afterFieldUpdate() {
	if (props.type === 'number') {
		updateWorkingNumber(fieldValue.value);
		if (fieldValue.value !== props.modelValue) {
			emitUpdateModelValue(workingNumber.value);
		}
	}
	if (props.type === 'text') {
		if (document.activeElement === inputField.value) {
			setWorkingNumAtCursor();
		}
		if (fieldValue.value !== props.modelValue) {
			emitUpdateModelValue(fieldValue.value);
		}
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
function determineEmittable(value = '') {
	const min = minCast.value;
	const max = maxCast.value;

	const validNumber = getNumberFromValue(value);
	if (!validNumber) return false;

	let numAtStep = Big(validNumber);

	// If shift is pressed, round to exact increments of step
	if (isShiftDown.value) {
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

function getNumberFromValue(value: string) {
	return getFirstMatch(value, numRegex);
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
	const key = evt.key.toLowerCase();
	if (isDisplayNum.value && ['arrowup', 'arrowdown'].includes(key)) {
		evt.preventDefault();
		switch (key) {
			case 'arrowup':
				stepUp();
				break;
			case 'arrowdown':
				stepDown();
				break;
		}
	}
}

function checkKeyupAction(evt: KeyboardEvent) {
	const key = evt.key.toLowerCase();
	if (props.type === 'text' && key.startsWith('arrow')) {
		setWorkingNumAtCursor();
	}
}

function globalKeydownAction(evt: KeyboardEvent) {
	const key = evt.key.toLowerCase();
	if (key === 'shift') {
		isShiftDown.value = true;
	}
}

function globalKeyupAction(evt: KeyboardEvent) {
	const key = evt.key.toLowerCase();
	if (key === 'shift') {
		isShiftDown.value = false;
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

	input?.focus();
	// Keep cursor at end of input if that's where it started
	if (pos.atEnd) {
		input?.setSelectionRange(length, length);
	} else {
		input?.setSelectionRange(pos.start, pos.end);
	}
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

async function onInput(evt: InputEvent) {
	emitInput(evt);
	afterFieldUpdate();
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
.smart-input {
	flex-grow: 1;
	width: 20px;
	height: 100%;
	position: relative;
	display: flex;
	align-items: center;
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
