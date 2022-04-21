<template>
	<div class="simple-input" :focus="focusField">
		<input
			ref="inputField"
			v-model="fieldValue"
			:placeholder="placeholder ? String(placeholder) : undefined"
			:type="type"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			:disabled="disabled"
			v-bind="$attrs"
		/>
	</div>
</template>

<script lang="ts">
export default {
	name: 'SimpleInput',
};
</script>

<script setup lang="ts">
import { ref, Ref, watch } from 'vue';

interface Props {
	disabled?: boolean;
	placeholder?: string;
	modelValue?: string | number;
	type?: string;
	spellcheck?: boolean;
	autocomplete?: string;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	placeholder: '',
	modelValue: '',
	type: 'text',
	spellcheck: false,
	autocomplete: 'off',
});

/**
 * Because we v-bind $attrs, any listeners defined on component will pass directly
 * through to the input, so long as the emit is not defined here.
 */
const emit = defineEmits(['update:modelValue']);

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
