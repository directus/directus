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
				<smart-input
					v-focus="autofocus"
					v-bind="passthroughAttributes"
					:type="type"
					:min="min === undefined || min === null ? undefined : String(min)"
					:max="max === undefined || max === null ? undefined : String(max)"
					:step="String(step)"
					:field-data="fieldData"
					:autocomplete="autocomplete"
					:placeholder="placeholder ? String(placeholder) : undefined"
					:disabled="disabled"
					:model-value="modelValue === undefined || modelValue === null ? '' : modelValue"
					v-on="listeners"
				/>
			</slot>
			<span v-if="suffix" class="suffix">{{ suffix }}</span>
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
export default {
	inheritAttrs: false,
};
</script>

<script lang="ts" setup>
import { computed, useAttrs, ref, Ref, watch } from 'vue';
import slugify from '@sindresorhus/slugify';
import smartInput from './smart-input.vue';
import { Field } from '@directus/shared/types';

interface Props {
	autofocus?: boolean;
	disabled?: boolean;
	clickable?: boolean;
	prefix?: string;
	suffix?: string;
	fullWidth?: boolean;
	placeholder?: string | number;
	modelValue?: string | number;
	nullable?: boolean;
	slug?: boolean;
	slugSeparator?: string;
	type?: string;
	fieldData?: Field;
	hideArrows?: boolean;
	max?: number | string;
	min?: number | string;
	step?: number | string;
	active?: boolean;
	dbSafe?: boolean;
	trim?: boolean;
	autocomplete?: string;
	small?: boolean;
	smartNumberControls?: boolean;
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
	fieldData: undefined,
	hideArrows: false,
	max: undefined,
	min: undefined,
	step: 1,
	active: false,
	dbSafe: false,
	trim: false,
	autocomplete: 'off',
	small: false,
	smartNumberControls: false,
});

const emit = defineEmits(['click', 'keydown', 'update:modelValue', 'focus']);

const attrs = useAttrs();

const listeners = computed(() => ({
	input: emitValue,
	keydown: processValue,
	blur: (e: Event) => {
		trimIfEnabled();
		if (typeof attrs.onBlur === 'function') attrs.onBlur(e);
	},
	focus: (e: FocusEvent) => emit('focus', e),
}));

const passthroughAttributes = computed(() => ({ ...attrs, class: undefined }));

const classes = computed(() => [
	{
		'full-width': props.fullWidth,
		'has-click': props.clickable,
		disabled: props.disabled,
		small: props.small,
	},
	...((attrs.class || '') as string).split(' '),
]);

const initialValue: Ref<string | number | null> = ref(null);

watch(
	() => props.modelValue,
	(newModel) => {
		// On first update of model value we'll treat value as initial
		if (initialValue.value === null || initialValue.value === undefined) {
			initialValue.value = newModel;
		}
	}
);

function processValue(event: KeyboardEvent) {
	if (!event.key) return;
	const key = event.key.toLowerCase();
	const systemKeys = ['meta', 'shift', 'alt', 'backspace', 'delete', 'tab'];
	const value = (event.target as HTMLInputElement).value;

	if (props.slug === true) {
		const slugSafeCharacters = 'abcdefghijklmnopqrstuvwxyz01234567890-_~ '.split('');

		const isAllowed = slugSafeCharacters.includes(key) || systemKeys.includes(key) || key.startsWith('arrow');

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

function emitValue(evt: InputEvent) {
	let value = (evt.target as HTMLInputElement).value;

	if (props.nullable === true && (value === null || value === '')) {
		emit('update:modelValue', null);
		return;
	}

	if (props.type === 'number') {
		/**
		 * If initial value was a number whose string representation is equal to the new value,
		 * emit the numerical initial value. This avoids breaking edits tracking.
		 */
		if (typeof initialValue.value === 'number' && String(initialValue.value) === value) {
			emit('update:modelValue', initialValue.value);
		} else if (props.modelValue !== value) {
			emit('update:modelValue', value);
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
		}

		emit('update:modelValue', value);
	}
}
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
			box-shadow: 0 0 16px -8px var(--primary);
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

		.prefix {
			margin-right: 4px;
		}

		.suffix {
			margin-left: 4px;
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
				color: var(--foreground-subdued);
			}
		}

		.append-outer {
			margin-left: 8px;
		}
	}
}
</style>
