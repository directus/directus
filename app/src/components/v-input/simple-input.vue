<template>
	<div class="simple-input" :focus="focusField">
		<input
			ref="inputField"
			v-model="fieldValue"
			:placeholder="placeholder ? String(placeholder) : undefined"
			:type="type"
			:autocomplete="autocomplete"
			:disabled="disabled"
			v-bind="$attrs"
			v-on="listeners"
		/>
	</div>
</template>

<script lang="ts">
export default {
	name: 'SimpleInput',
};
</script>

<script setup lang="ts">
import { computed, ref, Ref, watch } from 'vue';

interface Props {
	disabled?: boolean;
	placeholder?: string;
	modelValue?: string | number;
	type?: string;
	autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	placeholder: '',
	modelValue: '',
	type: 'text',
	autocomplete: 'off',
});

const emit = defineEmits(['update:modelValue', 'click', 'keydown', 'keyup', 'input', 'blur', 'focus']);

const inputField: Ref<HTMLInputElement | null> = ref(null);

const fieldValue = ref(String(props.modelValue));

watch(
	() => props.modelValue,
	(newModel) => {
		const value = newModel;

		if (value !== fieldValue.value) {
			updateField(value);
		}
	}
);

const listeners = computed(() => ({
	input: emitInput,
	click: emitClick,
	focus: emitFocus,
	blur: emitBlur,
	keydown: emitKeydown,
	keyup: emitKeyup,
}));

function updateField(value: any) {
	fieldValue.value = value;
	emitUpdateModelValue(value);
}

// Called when .focus() is called on root element
function focusField() {
	inputField?.value?.focus();
}

/** Emits */

function emitUpdateModelValue(value: any) {
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
</script>

<style scoped lang="scss">
.simple-input {
	flex-grow: 1;
	width: 20px;
	height: 100%;
	position: relative;
	display: flex;
	align-items: center;
}
</style>
