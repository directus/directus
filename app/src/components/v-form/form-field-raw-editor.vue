<template>
	<v-dialog :model-value="showModal" persistent @esc="$emit('cancel')">
		<v-card>
			<v-card-title>{{ disabled ? t('view_raw_value') : t('edit_raw_value') }}</v-card-title>
			<v-card-text>
				<interface-input-code
					v-if="type === 'object'"
					:value="internalValue"
					:disabled="disabled"
					:line-number="false"
					:alt-options="{ gutters: false }"
					:placeholder="t('enter_raw_value')"
					language="json"
					@input="internalValue = $event"
				/>
				<interface-system-raw-editor
					v-else
					:value="internalValue"
					:type="type === 'string' ? 'text' : type"
					:disabled="disabled"
					language="plaintext"
					:placeholder="t('enter_raw_value')"
					@input="internalValue = $event"
				/>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="$emit('cancel')">{{ t('cancel') }}</v-button>
				<v-button @click.prevent="setRawValue">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { getJSType } from '@/utils/get-js-type';
import { isNil } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormField } from './types';

interface Props {
	field: FormField;
	showModal: boolean;
	disabled: boolean;
	currentValue: unknown;
}

const props = withDefaults(defineProps<Props>(), {
	showModal: false,
	disabled: false,
	currentValue: undefined,
});

const emit = defineEmits(['cancel', 'setRawValue']);

const { t } = useI18n();
const internalValue = ref();

const type = computed(() => {
	return getJSType(props.field);
});

watch(
	() => props.showModal,
	(isActive) => {
		if (isActive) {
			if (isNil(props.currentValue)) {
				return;
			}

			if (type.value === 'object') {
				internalValue.value = JSON.stringify(props.currentValue, null, '\t');
			} else {
				internalValue.value = String(props.currentValue);
			}
		}
	}
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
			emit('setRawValue', JSON.parse(internalValue.value));
			break;
		default:
			emit('setRawValue', internalValue.value);
			break;
	}
};
</script>

<style lang="scss" scoped>
.v-card-text {
	.input-code {
		:deep(.CodeMirror),
		:deep(.CodeMirror-scroll) {
			max-height: var(--input-height-tall);
		}
	}
}
</style>
