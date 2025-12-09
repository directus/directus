<script setup lang="ts">
import { getJSType } from '@/utils/get-js-type';
import { getStringifiedValue } from '@/utils/get-stringified-value';
import { isValidJSON, parseJSON } from '@directus/utils';
import { isNil } from 'lodash';
import { computed, ref, watch } from 'vue';
import type { FormField } from '../types';
import type { Field } from '@directus/types';

const props = withDefaults(
	defineProps<{
		field: FormField;
		showModal?: boolean;
		disabled?: boolean;
		currentValue?: unknown;
	}>(),
	{
		showModal: false,
		disabled: false,
		currentValue: undefined,
	},
);

const emit = defineEmits(['cancel', 'setRawValue']);
const internalValue = ref();

const type = computed(() => {
	return getJSType(props.field as Field);
});

watch(
	() => props.showModal,
	(isActive) => {
		if (isActive) {
			if (isNil(props.currentValue)) {
				return;
			}

			internalValue.value = getStringifiedValue(props.currentValue, type.value === 'object');
		}
	},
);

const setRawValue = () => {
	switch (type.value) {
		case 'string':
			emit('setRawValue', internalValue.value);
			break;
		case 'number':
			emit('setRawValue', Number(internalValue.value));
			break;
		case 'boolean':
			emit('setRawValue', internalValue.value === 'true');
			break;
		case 'object':
			emit('setRawValue', isValidJSON(internalValue.value) ? parseJSON(internalValue.value) : internalValue.value);
			break;
		default:
			emit('setRawValue', internalValue.value);
			break;
	}
};
</script>

<template>
	<v-dialog :model-value="showModal" persistent @esc="$emit('cancel')" @apply="setRawValue">
		<v-card>
			<v-card-title>{{ disabled ? $t('view_raw_value') : $t('edit_raw_value') }}</v-card-title>
			<v-card-text>
				<interface-input-code
					v-if="type === 'object'"
					:value="internalValue"
					:disabled="disabled"
					:line-number="false"
					:alt-options="{ gutters: false }"
					:placeholder="$t('enter_raw_value')"
					language="json"
					@input="internalValue = $event"
				/>
				<interface-system-raw-editor
					v-else
					:value="internalValue"
					:type="type === 'string' ? 'text' : type"
					:disabled="disabled"
					language="plaintext"
					:placeholder="$t('enter_raw_value')"
					@input="internalValue = $event"
				/>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="$emit('cancel')">{{ $t('cancel') }}</v-button>
				<v-button @click.prevent="setRawValue">{{ $t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.v-card-text {
	.input-code {
		:deep(.CodeMirror),
		:deep(.CodeMirror-scroll) {
			max-block-size: var(--input-height-max);
		}
	}
}
</style>
